// tailwind.css 必须最先引入：其内声明的 @layer 顺序需先于 Semi 组件样式注入生效
import "@/src/styles/tailwind.css";
import "@douyinfe/semi-ui/react19-adapter";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
