import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function HomeNavbar() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        <img src="/HERO.png" alt="PesoWise Logo" className="h-8 w-auto" />
                        <span className="text-xl font-bold text-blue-600">PesoWise</span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => navigate("/")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Home
                        </button>
                        <button
                            onClick={() => navigate("/features")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => navigate("/how-it-works")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            How It Works
                        </button>
                        <button
                            onClick={() => navigate("/security")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Security
                        </button>
                        <button
                            onClick={() => navigate("/pricing")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Pricing
                        </button>
                        <button
                            onClick={() => navigate("/contact")}
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Contact
                        </button>
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/contact")}
                            className="text-sm"
                        >
                            Get Started Free
                        </Button>
                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold px-7 py-2.5 shadow-lg ring-2 ring-blue-600/20"
                            aria-label="Login to PesoWise"
                        >
                            Login
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-700"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    {/* Mobile Login Button - Always Visible */}
                    <Button
                        onClick={() => navigate("/auth")}
                        className="md:hidden bg-blue-600 hover:bg-blue-700 text-white text-base font-bold px-5 py-2.5 shadow-lg ring-2 ring-blue-600/20 ml-2"
                        aria-label="Login to PesoWise"
                    >
                        Login
                    </Button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-white py-4">
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => { navigate("/features"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => { navigate("/how-it-works"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                How It Works
                            </button>
                            <button
                                onClick={() => { navigate("/security"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Security
                            </button>
                            <button
                                onClick={() => { navigate("/pricing"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => { navigate("/contact"); setMobileMenuOpen(false); }}
                                className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Contact
                            </button>
                            <div className="px-4 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => { navigate("/contact"); setMobileMenuOpen(false); }}
                                    className="w-full"
                                >
                                    Get Started Free
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
