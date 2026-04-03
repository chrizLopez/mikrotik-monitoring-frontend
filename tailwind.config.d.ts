import forms from "@tailwindcss/forms";
declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                surface: string;
                "surface-soft": string;
                "surface-muted": string;
                line: string;
                text: string;
                "text-soft": string;
                accent: {
                    DEFAULT: string;
                    soft: string;
                };
                success: string;
                warning: string;
                danger: string;
            };
            boxShadow: {
                panel: string;
            };
            backgroundImage: {
                "dashboard-grid": string;
            };
        };
    };
    plugins: (typeof forms)[];
};
export default _default;
