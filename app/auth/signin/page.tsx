import SignInForm from "../components/SignInForm";
import CanvasComponent from "./canvasComponent";
import "./signin.css";

export default function SignInPage() {
  return (
    <>
      <CanvasComponent />
      <div className="signIn-container">
        <div className="container">
          <div className="">
            <h1 className="h1">Welcome to 10XAI</h1>
            <p className="">Sign up to get free GPT4 / Claude3.5 every day</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </>
  );
}
