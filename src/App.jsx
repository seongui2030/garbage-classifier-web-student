import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "./App.css";


// ============================================================
// 1. 모델 기본 설정
// ============================================================

// CNN 학습에 사용한 이미지 크기
const IMAGE_SIZE = 180;

// 최고 확률이 60%보다 낮으면 재촬영 안내 표시
const LOW_CONFIDENCE_LIMIT = 60;


// ============================================================
// 2. React 메인 컴포넌트
// ============================================================

function App() {
  // TensorFlow.js CNN 모델
  const [model, setModel] = useState(null);

  // labels.json에서 불러온 10개 클래스 정보
  const [labels, setLabels] = useState([]);

  // 모델 준비 상태
  const [modelStatus, setModelStatus] = useState(
    "CNN 모델을 불러오는 중입니다."
  );

  // 선택한 사진의 미리보기 주소
  const [previewUrl, setPreviewUrl] = useState("");

  // 현재 AI가 분류 중인지 저장
  const [isPredicting, setIsPredicting] = useState(false);

  // 10개 클래스의 분류 확률
  const [results, setResults] = useState([]);

  // 오류 안내 문장
  const [errorMessage, setErrorMessage] = useState("");

  // 화면에 표시된 img 태그를 참조
  const imageRef = useRef(null);


  // ==========================================================
  // 3. 웹앱을 시작할 때 CNN 모델과 클래스 불러오기
  // ==========================================================

  useEffect(() => {
    let loadedModel = null;
    let cancelled = false;

    async function prepareModel() {
      try {
        setModelStatus("TensorFlow.js를 준비하는 중입니다.");

        // TensorFlow.js가 사용할 장치를 준비합니다.
        await tf.ready();

        console.log(
          "TensorFlow.js 실행 장치:",
          tf.getBackend()
        );

        setModelStatus("CNN 모델을 불러오는 중입니다.");

        /*
          import.meta.env.BASE_URL을 사용하는 이유

          로컬 실행:
          /model/model.json

          GitHub Pages:
          /저장소이름/model/model.json

          두 환경의 경로를 모두 처리할 수 있습니다.
        */
        const modelUrl =
          `${import.meta.env.BASE_URL}model/model.json`;

        const labelsUrl =
          `${import.meta.env.BASE_URL}model/labels.json`;

        // 모델과 클래스 정보를 동시에 불러옵니다.
        const [newModel, labelsResponse] =
          await Promise.all([
            tf.loadLayersModel(modelUrl),
            fetch(labelsUrl),
          ]);

        loadedModel = newModel;

        if (!labelsResponse.ok) {
          throw new Error(
            `labels.json 불러오기 실패: ${
              labelsResponse.status
            }`
          );
        }

        const loadedLabels =
          await labelsResponse.json();

        // 클래스가 정확히 10개인지 확인합니다.
        if (loadedLabels.length !== 10) {
          throw new Error(
            `클래스는 10개여야 합니다. 현재: ${
              loadedLabels.length
            }개`
          );
        }

        /*
          모델을 처음 실행할 때 시간이 오래 걸릴 수 있습니다.
          빈 이미지로 한 번 미리 실행해 준비시킵니다.
        */
        const warmupInput = tf.zeros(
          [1, IMAGE_SIZE, IMAGE_SIZE, 3]
        );

        const warmupOutput =
          newModel.predict(warmupInput);

        await warmupOutput.data();

        warmupInput.dispose();
        warmupOutput.dispose();

        // 컴포넌트가 이미 종료됐다면 모델을 제거합니다.
        if (cancelled) {
          newModel.dispose();
          return;
        }

        setModel(newModel);
        setLabels(loadedLabels);
        setModelStatus("CNN 모델 준비 완료");

        console.log(
          "모델 입력 형태:",
          newModel.inputs[0].shape
        );

        console.log(
          "모델 출력 형태:",
          newModel.outputs[0].shape
        );
      } catch (error) {
        console.error("모델 준비 오류:", error);

        setModelStatus("CNN 모델 불러오기 실패");

        setErrorMessage(
          "모델을 불러오지 못했습니다. " +
          "public/model 폴더의 파일을 확인하세요."
        );
      }
    }

    prepareModel();

    // 화면이 종료될 때 모델 메모리를 정리합니다.
    return () => {
      cancelled = true;

      if (loadedModel) {
        loadedModel.dispose();
      }
    };
  }, []);


  // ==========================================================
  // 4. 사진을 선택했을 때 실행
  // ==========================================================

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    // 사진 선택을 취소했다면 종료합니다.
    if (!selectedFile) {
      return;
    }

    // 이미지 파일인지 확인합니다.
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage(
        "JPG, PNG 등의 이미지 파일만 선택할 수 있습니다."
      );

      return;
    }

    // 이전 예측 결과를 초기화합니다.
    setResults([]);
    setErrorMessage("");

    // 선택한 사진을 브라우저에서 표시할 임시 주소
    const newPreviewUrl =
      URL.createObjectURL(selectedFile);

    setPreviewUrl((oldPreviewUrl) => {
      // 이전 사진의 임시 주소를 메모리에서 제거합니다.
      if (oldPreviewUrl) {
        URL.revokeObjectURL(oldPreviewUrl);
      }

      return newPreviewUrl;
    });
  }


  // ==========================================================
  // 5. 사진을 CNN 입력 형태로 전처리
  // ==========================================================

  function makeInputTensor(imageElement) {
    /*
      tf.tidy() 안에서 만들어진 중간 텐서는
      최종 반환 텐서를 제외하고 자동으로 제거됩니다.
    */
    return tf.tidy(() => {
      /*
        HTML img를 RGB 숫자 배열로 바꿉니다.

        형태:
        (사진 높이, 사진 너비, RGB 3채널)
      */
      const originalTensor =
        tf.browser.fromPixels(imageElement, 3);

      const [
        originalHeight,
        originalWidth,
      ] = originalTensor.shape;

      /*
        가로와 세로 중 짧은 길이를 선택합니다.

        예:
        사진 크기 1200×900
        정사각형 크기 900×900
      */
      const squareSize = Math.min(
        originalHeight,
        originalWidth
      );

      // 사진 중앙에서 자르기 위한 시작 위치
      const top = Math.floor(
        (originalHeight - squareSize) / 2
      );

      const left = Math.floor(
        (originalWidth - squareSize) / 2
      );

      // 사진 중앙을 정사각형으로 자릅니다.
      const squareTensor = originalTensor.slice(
        [top, left, 0],
        [squareSize, squareSize, 3]
      );

      // 정사각형 사진을 180×180으로 변환합니다.
      const resizedTensor = tf.image.resizeBilinear(
        squareTensor,
        [IMAGE_SIZE, IMAGE_SIZE],
        true
      );

      /*
        모델은 여러 장을 한꺼번에 받는 형태이므로
        맨 앞에 이미지 개수 차원을 추가합니다.

        변경 전:
        (180, 180, 3)

        변경 후:
        (1, 180, 180, 3)
      */
      const batchedTensor = resizedTensor
        .toFloat()
        .expandDims(0);

      /*
        매우 중요합니다.

        현재 모델 내부에는 다음 전처리가 들어 있습니다.

        Rescaling(1 / 255)

        따라서 React에서 다음 처리를 하면 안 됩니다.

        batchedTensor.div(255)
      */

      return batchedTensor;
    });
  }


  // ==========================================================
  // 6. CNN 이미지 분류 실행
  // ==========================================================

  async function predictImage() {
    if (!model) {
      setErrorMessage(
        "CNN 모델이 아직 준비되지 않았습니다."
      );

      return;
    }

    if (!previewUrl || !imageRef.current) {
      setErrorMessage(
        "먼저 쓰레기 사진을 촬영하거나 선택하세요."
      );

      return;
    }

    if (labels.length !== 10) {
      setErrorMessage(
        "10개 클래스 정보를 확인할 수 없습니다."
      );

      return;
    }

    setIsPredicting(true);
    setErrorMessage("");
    setResults([]);

    let inputTensor = null;
    let outputTensor = null;

    try {
      // 사진을 (1, 180, 180, 3)으로 전처리합니다.
      inputTensor =
        makeInputTensor(imageRef.current);

      console.log(
        "CNN 입력 텐서 형태:",
        inputTensor.shape
      );

      // CNN 모델로 사진을 분류합니다.
      outputTensor =
        model.predict(inputTensor);

      // TensorFlow 텐서를 JavaScript 배열로 변환합니다.
      const probabilityValues =
        await outputTensor.data();

      /*
        모델 출력값은 다음 순서입니다.

        0: battery
        1: cardboard
        2: clothes
        3: food
        4: glass
        5: metal
        6: paper
        7: plastic
        8: shoes
        9: trash
      */

      const predictionResults = labels.map(
        (label, index) => ({
          ...label,

          // 0~1 값을 백분율로 바꿉니다.
          probability:
            Number(probabilityValues[index]) * 100,
        })
      );

      // 확률이 높은 순서대로 정렬합니다.
      predictionResults.sort(
        (first, second) =>
          second.probability - first.probability
      );

      setResults(predictionResults);
    } catch (error) {
      console.error("사진 분류 오류:", error);

      setErrorMessage(
        "사진 분류 중 오류가 발생했습니다. " +
        "다른 사진으로 다시 시도하세요."
      );
    } finally {
      /*
        사용이 끝난 텐서를 메모리에서 제거합니다.
        휴대폰에서 여러 번 실행할 때 필요한 과정입니다.
      */
      if (inputTensor) {
        inputTensor.dispose();
      }

      if (outputTensor) {
        outputTensor.dispose();
      }

      setIsPredicting(false);
    }
  }


  // ==========================================================
  // 7. 가장 확률이 높은 클래스
  // ==========================================================

  const bestResult =
    results.length > 0 ? results[0] : null;


  // ==========================================================
  // 8. 화면 만들기
  // ==========================================================

  return (
    <main className="app">
      <section className="app-container">
        <header className="app-header">
          <span className="header-icon">
            ♻️
          </span>

          <div>
            <h1>AI 쓰레기 분류</h1>

            <p>
              쓰레기 사진을 찍으면 CNN이 10개
              카테고리의 확률을 계산합니다.
            </p>
          </div>
        </header>

        {/* CNN 모델 상태 */}
        <div
          className={
            model
              ? "model-status success"
              : "model-status loading"
          }
        >
          <span className="status-dot" />
          {modelStatus}
        </div>

        {/* 사진 입력 영역 */}
        <section className="card">
          <h2>1. 쓰레기 사진 입력</h2>

          <p className="guide-text">
            밝은 곳에서 쓰레기 하나가 사진 중앙에
            오도록 촬영하세요.
          </p>

          <label className="camera-button">
            <span>
              📷 사진 촬영 또는 선택
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
            />
          </label>

          {/* 선택한 사진 미리보기 */}
          {previewUrl && (
            <div className="preview-area">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="선택한 쓰레기"
                className="preview-image"
              />

              <p>
                사진 중앙을 정사각형으로 자른 뒤
                180×180으로 변환합니다.
              </p>
            </div>
          )}

          <button
            type="button"
            className="predict-button"
            onClick={predictImage}
            disabled={
              !model ||
              !previewUrl ||
              isPredicting
            }
          >
            {isPredicting
              ? "AI가 분류하는 중..."
              : "이 사진 분류하기"}
          </button>
        </section>

        {/* 오류 메시지 */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* 예측 결과 */}
        {bestResult && (
          <>
            <section className="card best-result">
              <h2>2. AI 분류 결과</h2>

              <div className="result-category">
                {bestResult.korean}
              </div>

              <p className="english-name">
                {bestResult.english}
              </p>

              <div className="confidence">
                <span>신뢰도</span>

                <strong>
                  {bestResult.probability.toFixed(2)}%
                </strong>
              </div>

              {/* 신뢰도가 낮을 때 안내 */}
              {bestResult.probability <
                LOW_CONFIDENCE_LIMIT && (
                <p className="uncertain-message">
                  ⚠️ 신뢰도가 낮습니다. 밝은 곳에서
                  물체 하나만 중앙에 놓고 다시
                  촬영해 보세요.
                </p>
              )}
            </section>

            {/* 10개 클래스별 확률 */}
            <section className="card">
              <h2>3. 클래스별 예측 확률</h2>

              <div className="probability-list">
                {results.map((result, rank) => (
                  <div
                    className="probability-item"
                    key={result.index}
                  >
                    <div className="probability-heading">
                      <span>
                        <b>{rank + 1}.</b>
                        {" "}
                        {result.korean}
                      </span>

                      <strong>
                        {result.probability.toFixed(2)}%
                      </strong>
                    </div>

                    <div className="probability-track">
                      <div
                        className="probability-bar"
                        style={{
                          width:
                            `${result.probability}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <footer>
          입력 크기: 180×180 RGB · 출력 클래스: 10개
        </footer>
      </section>
    </main>
  );
}

export default App;