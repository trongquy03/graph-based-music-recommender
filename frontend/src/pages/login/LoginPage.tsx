import tunewiseLogo from '/tunewise_logo.png';
import googleLogo from '/google-logo.png';
import facebookLogo from '/facebook-logo.png';
import githubLogo from '/github-logo.png';
import { Button } from "../../components/ui/button";
import { useSignIn } from "@clerk/clerk-react";

const SignInForm = () => {
    const { signIn, isLoaded } = useSignIn();
    if (!isLoaded) return null;

    const handleSignIn = async (strategy: "oauth_google" | "oauth_facebook" | "oauth_github") => {
        signIn.authenticateWithRedirect({
            strategy: strategy,
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/auth-callback",
        });
    };

    return (
        <div className="bg-black h-screen flex items-center justify-center px-4">
            <div className="backdrop-blur-md bg-white/5 rounded-2xl shadow-2xl p-10 max-w-sm w-full border border-white/10">
                <div className="flex flex-col items-center mb-6">
                    <img
                        src={tunewiseLogo}
                        alt="TuneWise Logo"
                        className="h-14 w-14 mb-4 animate-bounce-slow"
                    />
                    <h1 className="text-white text-2xl font-bold text-center">
                        Đăng nhập vào <span className="text-[#ec4899]">TuneWise</span>
                    </h1>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={() => handleSignIn("oauth_google")}
                        className="w-full bg-[#4285F4] hover:bg-[#3574F0] text-white py-3 rounded-xl flex items-center justify-center font-semibold transition duration-300 hover:shadow-lg cursor-pointer hover:shadow-[#4285F4]/50"
                    >
                        <img src={googleLogo} alt="Google Logo" className="h-5 w-5 mr-3" />
                       Tiếp tục với Google
                    </Button>

                    <Button
                        onClick={() => handleSignIn("oauth_facebook")}
                        className="w-full bg-[#1877F2] hover:bg-[#1565D8] text-white py-3 rounded-xl flex items-center justify-center font-semibold transition duration-300 hover:shadow-lg cursor-pointer hover:shadow-[#1877F2]/50"
                    >
                        <img src={facebookLogo} alt="Facebook Logo" className="h-5 w-5 mr-3" />
                        Tiếp tục với Facebook
                    </Button>

                    <Button
                        onClick={() => handleSignIn("oauth_github")}
                        className="w-full bg-[#24292e] hover:bg-[#1c2125] text-white py-3 rounded-xl flex items-center justify-center font-semibold transition duration-300 hover:shadow-lg cursor-pointer hover:shadow-[#ffffff]/10"
                    >
                        <img src={githubLogo} alt="GitHub Logo" className="h-5 w-5 mr-3" />
                        Tiếp tục với GitHub
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignInForm;
