import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 학생용 GitHub Pages 저장소 이름
  base: "/garbage-classifier-web-student/",
});