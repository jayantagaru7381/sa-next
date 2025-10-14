// components/LottieAnimation.js
import { Box, Modal } from '@mui/material';
import Lottie from "lottie-react";
import type { JSX } from "react";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'transparent',
    p: 4,
};
interface LottieAnimationProps {
    animationData: object;
    loop?: boolean;
    autoplay?: boolean;
    open?: boolean;
}
const LottieAnimation: React.FC<LottieAnimationProps> = ({ animationData, loop = true, autoplay = true, open = true }): JSX.Element => {
    return (
        <Modal
            open={open}
            disableEscapeKeyDown
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
            aria-labelledby="lottie-animation-modal"
            aria-describedby="lottie-animation-description"
        >
            <Box sx={style}>
                <Lottie
                    animationData={animationData}
                    loop={loop}
                    autoplay={autoplay}
                    style={{ width: 100, height: 100 }}
                />
            </Box>
        </Modal>
    );
};

export default LottieAnimation;