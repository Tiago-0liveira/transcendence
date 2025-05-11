import { toast } from 'tailwind-toast';

const POSITION_Y = 'bottom' as const;
const POSITION_X = 'end' as const;
const DURATION = 5000;
const SHAPE = 'pill' as const;

export const toastHelper = {
    success: (message: string, title: string = 'Success') => {
        toast()
            .default(title, message)
            .with({ color: 'green' })
            .as(SHAPE)
            .from(POSITION_Y, POSITION_X)
            .for(DURATION)
            .show();
    },

    error: (message: string, title: string = 'Error') => {
        toast()
            .default(title, message)
            .with({ color: 'red' })
            .as(SHAPE)
            .from(POSITION_Y, POSITION_X)
            .for(DURATION)
            .show();
    },

    info: (message: string, title: string = 'Info') => {
        toast()
            .default(title, message)
            .with({ color: 'blue' })
            .as(SHAPE)
            .from(POSITION_Y, POSITION_X)
            .for(DURATION)
            .show();
    },

    warning: (message: string, title: string = 'Warning') => {
        toast()
            .default(title, message)
            .with({ color: 'yellow' })
            .as(SHAPE)
            .from(POSITION_Y, POSITION_X)
            .for(DURATION)
            .show();
    },
};
