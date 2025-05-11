import toast from 'tailwind-toast';

const defaultOptions = {
    duration: 5000,
    positionX: 'right' as const,
    positionY: 'bottom' as const,
};

export const toastHelper = {
    success: (message: string, title: string = 'Success') => {
        toast()
            .success(title, message)
            .with({ ...defaultOptions, color: 'green' })
            .dismissible()
            .show();
    },

    error: (message: string, title: string = 'Error') => {
        toast()
            .error(title, message)
            .with({ ...defaultOptions, color: 'red' })
            .dismissible()
            .show();
    },

    info: (message: string, title: string = 'Info') => {
        toast()
            .info(title, message)
            .with({ ...defaultOptions, color: 'blue' })
            .dismissible()
            .show();
    },

    warning: (message: string, title: string = 'Warning') => {
        toast()
            .warning(title, message)
            .with({ ...defaultOptions, color: 'yellow' })
            .dismissible()
            .show();
    },
};
