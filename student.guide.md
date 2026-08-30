# AI 분리수거 비서 학생용 프로젝트 실행 안내서

학생은 PowerShell에서 다음 순서대로 실행하면 됩니다.

## 1. 필요한 프로그램 확인

먼저 컴퓨터에 Git, Node.js, npm, Visual Studio Code가 설치되어 있는지 확인합니다.

PowerShell을 실행한 후 다음 명령어를 한 줄씩 입력합니다.

```powershell
git --version
node --version
npm --version
code --version
```

버전 번호가 표시되면 설치가 완료된 상태입니다. 명령어를 찾을 수 없다는 메시지가 나오면 해당 프로그램을 먼저 설치해야 합니다.

## 2. 프로젝트를 저장할 폴더 만들기

이 안내서에서는 C 드라이브의 `AI-Class` 폴더에 프로젝트를 저장합니다.

```powershell
cd C:\
mkdir AI-Class
cd AI-Class
```

`AI-Class` 폴더가 이미 있다면 다음처럼 이동만 합니다.

```powershell
cd C:\AI-Class
```

## 3. 학생용 GitHub 저장소 복제하기

`git clone`은 GitHub 저장소의 소스 코드를 내 컴퓨터로 복사하는 명령어입니다.

```powershell
git clone https://github.com/seongui2030/garbage-classifier-web-student.git
```

복제가 끝나면 `AI-Class` 폴더 안에 `garbage-classifier-web-student` 폴더가 만들어집니다.

## 4. 프로젝트 폴더로 이동하기

```powershell
cd garbage-classifier-web-student
```

현재 위치를 확인하려면 다음 명령어를 실행합니다.

```powershell
pwd
```

정상적인 위치는 다음과 비슷합니다.

```text
C:\AI-Class\garbage-classifier-web-student
```

## 5. 프로젝트 라이브러리 설치하기

React, Vite, TensorFlow.js 등 프로젝트 실행에 필요한 라이브러리를 설치합니다.

```powershell
npm install
```

설치가 끝나면 프로젝트 폴더 안에 `node_modules` 폴더가 만들어집니다. 이 폴더는 직접 수정하지 않습니다.

## 6. Visual Studio Code로 프로젝트 열기

현재 프로젝트 폴더를 Visual Studio Code로 엽니다.

```powershell
code .
```

마침표(`.`)는 현재 폴더를 의미합니다.

## 7. 개발 서버 실행하기

Visual Studio Code의 터미널이나 기존 PowerShell에서 다음 명령어를 실행합니다.

```powershell
npm run dev
```

정상적으로 실행되면 다음과 비슷한 주소가 표시됩니다.

```text
Local: http://localhost:5173/
```

`Ctrl` 키를 누른 상태에서 주소를 클릭하거나 웹 브라우저 주소창에 입력합니다.

5173번 포트를 다른 프로그램이 사용 중이면 다음처럼 다른 번호가 표시될 수 있습니다.

```text
Port 5173 is in use, trying another one...
Local: http://localhost:5174/
```

이것은 오류가 아닙니다. 화면에 표시된 새 주소로 접속하면 됩니다.

## 8. 웹앱 동작 확인하기

웹 브라우저에 `AI 쓰레기 분류` 화면이 나타나는지 확인합니다.

1. `사진 촬영 또는 선택` 버튼을 누릅니다.
2. 쓰레기 사진 한 장을 선택합니다.
3. `이 사진 분류하기` 버튼을 누릅니다.
4. 가장 높은 확률의 쓰레기 카테고리를 확인합니다.
5. 10개 카테고리별 예측 확률을 확인합니다.

## 9. 개발 서버 종료하기

개발 서버가 실행 중인 터미널을 클릭한 후 다음 키를 누릅니다.

```text
Ctrl + C
```

종료 여부를 묻는 메시지가 나오면 `Y`를 입력한 후 Enter 키를 누릅니다.

## 10. 다음 수업에서 다시 실행하기

프로젝트를 다시 복제할 필요는 없습니다. PowerShell에서 기존 프로젝트 폴더로 이동한 후 개발 서버만 다시 실행합니다.

```powershell
cd C:\AI-Class\garbage-classifier-web-student
code .
npm run dev
```

## 전체 명령어 모음

처음 프로젝트를 내려받을 때 실행하는 명령어입니다.

```powershell
cd C:\
mkdir AI-Class
cd AI-Class
git clone https://github.com/seongui2030/garbage-classifier-web-student.git
cd garbage-classifier-web-student
npm install
code .
npm run dev
```

## 자주 발생하는 문제

### `git` 명령어를 찾을 수 없는 경우

Git이 설치되지 않았거나 설치 후 PowerShell을 다시 시작하지 않은 경우입니다. Git을 설치하고 PowerShell과 Visual Studio Code를 모두 다시 실행합니다.

### `npm` 명령어를 찾을 수 없는 경우

Node.js가 설치되지 않은 경우입니다. Node.js LTS 버전을 설치한 후 PowerShell을 다시 실행합니다.

### 프로젝트 폴더가 이미 존재하는 경우

다음과 같은 메시지가 나타날 수 있습니다.

```text
fatal: destination path 'garbage-classifier-web-student' already exists
```

이미 프로젝트를 복제한 상태이므로 다시 `git clone`하지 말고 기존 폴더로 이동합니다.

```powershell
cd C:\AI-Class\garbage-classifier-web-student
```

### 웹페이지가 열리지 않는 경우

`npm run dev`가 실행 중인지 확인하고 터미널에 표시된 실제 주소를 사용합니다. 개발 서버를 종료하면 `localhost` 웹페이지도 열리지 않습니다.

### CNN 모델을 불러오지 못하는 경우

프로젝트의 `public/model` 폴더에 다음 파일이 있는지 확인합니다.

```text
model.json
group1-shard1of1.bin
labels.json
labels.txt
```

파일 이름과 폴더 위치를 임의로 변경하지 않습니다.

## 프로젝트 폴더에서 수정하지 말아야 할 항목

- `node_modules` 폴더의 파일을 직접 수정하지 않습니다.
- `public/model`의 모델 파일 이름을 변경하지 않습니다.
- 잘 모르는 파일을 삭제하기 전에 교사에게 질문합니다.
- 오류가 발생하면 오류 메시지를 지우지 말고 화면을 캡처하여 확인합니다.

