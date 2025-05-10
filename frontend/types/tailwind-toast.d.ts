declare module 'tailwind-toast' {
    type ToastType = 'success' | 'error' | 'info' | 'warning';

    interface ToastOptions {
        color?: string;
        duration?: number;
        positionX?: 'left' | 'right' | 'center';
        positionY?: 'top' | 'bottom';
    }

    interface ToastInstance {
        success: (title: string, message: string) => ToastInstance;
        error: (title: string, message: string) => ToastInstance;
        info: (title: string, message: string) => ToastInstance;
        warning: (title: string, message: string) => ToastInstance;
        with: (options: ToastOptions) => ToastInstance;
        dismissible: () => ToastInstance;
        show: () => void;
    }

    const toast: () => ToastInstance;
    export default toast;
}
