import "server-only";

type SendVerificationEmailArgs = {
    to: string;
    url: string;
};

export async function sendVerificationEmail({
    to,
    url,
}: SendVerificationEmailArgs) {
    const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,

                template_params: {
                    to_email: to,
                    verification_url: url,
                },

                ...(process.env.EMAILJS_PRIVATE_KEY
                    ? {
                          accessToken: process.env.EMAILJS_PRIVATE_KEY,
                      }
                    : {}),
            }),
        },
    );

    if (!response.ok) {
        const error = await response.text();

        console.error("EmailJS Error:", error);

        throw new Error(`Failed To Send Verification Email: ${error}`);
    }

    return true;
}
