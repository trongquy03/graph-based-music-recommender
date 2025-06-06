import tunewiseLogo from "/tunewise_logo.png";
import googleLogo from "/google-logo.png";
import facebookLogo from "/facebook-logo.png";
import githubLogo from "/github-logo.png";
import { Button } from "../../components/ui/button";
import { useSignIn } from "@clerk/clerk-react";

const SignInForm = () => {
  const { signIn, isLoaded } = useSignIn();
  if (!isLoaded) return null;

    /**
     * @param strategy The oauth strategy to use. One of "oauth_google", "oauth_facebook", or "oauth_github"
     */
/*******  1db6f77d-e4a2-4d35-9d27-458c0cfac12d  *******/  const handleSignIn = async (
    strategy: "oauth_google" | "oauth_facebook" | "oauth_github"
  ) => {
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/auth-callback",
    });
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-zinc-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-3xl px-6 py-8 space-y-6 animate-fade-in">
        {/* Logo + title */}
        <div className="flex flex-col items-center text-center">
          <img
            src={tunewiseLogo}
            alt="TuneWise"
            className="h-14 w-14 mb-4 animate-bounce-slow"
          />
          <h1 className="text-white text-2xl font-bold">
            Đăng nhập vào <span className="text-pink-500">TuneWise</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Chọn phương thức đăng nhập của bạn
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleSignIn("oauth_google")}
            className="w-full bg-white text-zinc-800 hover:bg-zinc-100 py-3 rounded-xl flex items-center justify-start px-4 gap-3 shadow-sm hover:shadow-md transition"
          >
            <img src={googleLogo} alt="Google" className="w-5 h-5" />
            <span className="mx-auto font-semibold">Tiếp tục với Google</span>
          </Button>

          <Button
            onClick={() => handleSignIn("oauth_facebook")}
            className="w-full bg-[#1877F2] hover:bg-[#1565D8] text-white py-3 rounded-xl flex items-center justify-start px-4 gap-3 shadow-sm hover:shadow-lg transition"
          >
            <img src={facebookLogo} alt="Facebook" className="w-5 h-5" />
            <span className="mx-auto font-semibold">Tiếp tục với Facebook</span>
          </Button>

          <Button
            onClick={() => handleSignIn("oauth_github")}
            className="w-full bg-[#24292e] hover:bg-[#1c2125] text-white py-3 rounded-xl flex items-center justify-start px-4 gap-3 shadow-sm hover:shadow-lg transition"
          >
            <img src={githubLogo} alt="GitHub" className="w-5 h-5" />
            <span className="mx-auto font-semibold">Tiếp tục với GitHub</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;
