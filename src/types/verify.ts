type BaseVerifyProps = {
    isExpired: boolean;
    handleNagivate: () => void;
    verifyHeading: string;
    verifySubHeading: string;
    verifyDescription: string;
    expiredHeading: string;
    expiredSubHeading: string;
    navigateButtonText: string;
};

export type VerifyPropsInterface = BaseVerifyProps & (
    | {
        showRequestButton?: true;
        handleRequestNewLink: () => void;
        requestButtonText: string;
    }
    | {
        showRequestButton: false;
        handleRequestNewLink?: never;
        requestButtonText?: never;
    }
);