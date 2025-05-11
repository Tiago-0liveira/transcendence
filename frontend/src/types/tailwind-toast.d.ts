declare module 'tailwind-toast' {
    type ToastShape = 'pill' | 'square';
    type ToastPositionX = 'start' | 'center' | 'end';
    type ToastPositionY = 'top' | 'bottom';

    interface ToastOptions {
        shape?: ToastShape;
        duration?: number;
        speed?: number;
        positionX?: ToastPositionX;
        positionY?: ToastPositionY;
        color?: string;
        fontColor?: string;
        fontTone?: number;
    }

    interface ToastInstance {
        default: (title: string | null, message: string) => ToastInstance;
        success: (title: string | null, message: string) => ToastInstance;
        warning: (title: string | null, message: string) => ToastInstance;
        danger: (title: string | null, message: string) => ToastInstance;
        for: (ms: number) => ToastInstance;
        as: (shape: ToastShape) => ToastInstance;
        from: (positionY: ToastPositionY, positionX?: ToastPositionX) => ToastInstance;
        with: (options: ToastOptions) => ToastInstance;
        show: () => void;
    }

    export function toast(): ToastInstance;
}