import { Faqs } from "@/components/landing/faqs";
import { FooterCta } from "@/components/landing/footer-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Privacy } from "@/components/landing/privacy";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { EverythingInOneWorkspace } from "@/components/landing/workspace";
import { redirectIfSignedIn } from "@/lib/session";
import React from "react";

const Home = async () => {
    await redirectIfSignedIn();

    return (
        <div>
            <Hero />
            <HowItWorks />
            <EverythingInOneWorkspace />
            <Privacy />
            <Stats />
            <Testimonials />
            <Pricing />
            <Faqs />
            <FooterCta />
        </div>
    );
};

export default Home;
