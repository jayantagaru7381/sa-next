import styles from './Verify.module.css'

import type { JSX } from 'react';
import type { VerifyPropsInterface } from '../../../types/verify'

import React from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

const Verify: React.FC<VerifyPropsInterface> = React.memo(({
    isExpired = false, handleRequestNewLink, handleNagivate,
    verifyHeading, verifySubHeading, verifyDescription, requestButtonText,
    expiredHeading, expiredSubHeading, navigateButtonText, showRequestButton = true
}): JSX.Element => (
    <Paper className={styles.verifyContainer} elevation={1} sx={{ backgroundColor: 'common.white' }}>
        {!isExpired && <>
            <Typography variant="h5" component="h1" className={styles.heading}>
                {verifyHeading}
            </Typography>
            <Typography variant="body2" component="p" className={styles.subHeading}>
                {verifySubHeading}
            </Typography>
            <Box className={styles.loadingContainer}>
                <CircularProgress size={40} />
                <Typography variant="body2" component="p" className={styles.loadingText}>
                    {verifyDescription}
                </Typography>
            </Box>
        </>}
        {isExpired && <>
            <Typography variant="h6" className={styles.heading}>
                {expiredHeading}
            </Typography>
            <Typography variant="body2" className={styles.subHeading}>
                {expiredSubHeading}
            </Typography>
            <Box className={styles.buttonContainer}>
                <Box className={styles.buttonWrapper}>
                    {showRequestButton  && (
                        <Button
                            variant="contained"
                            className={styles.primaryButton}
                            onClick={handleRequestNewLink}
                            sx={{
                                backgroundColor: 'secondary.main',
                                color: 'common.white',
                                '&:hover': {
                                    backgroundColor: 'secondary.dark',
                                }
                            }}
                        >
                            {requestButtonText}
                        </Button>
                    )}

                    <Button
                        variant="text"
                        className={styles.secondaryButton}
                        onClick={handleNagivate}
                        sx={{
                            color: 'grey.800',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        {navigateButtonText}
                    </Button>
                </Box>
            </Box>
        </>}
    </Paper>
));

export default Verify
