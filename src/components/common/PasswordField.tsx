import React from "react";

import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import { EyeIcon, EyeOffIcon } from "../../assets/icons";

interface PasswordFieldProps {
    name: string;
    label: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
    helperText?: string;
    showPassword: boolean;
    onToggleVisibility: () => void;
    register?: any;
    autoComplete?: string;
    required?: boolean;
    fullWidth?: boolean;
    sx?: any;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
    name,
    label,
    value,
    onChange,
    error = false,
    helperText,
    showPassword,
    onToggleVisibility,
    register,
    autoComplete = "new-password",
    required = true,
    fullWidth = true,
    sx,
}) => {
    const fieldProps = register ? register(name) : { value, onChange };

    return (
        <TextField
            {...fieldProps}
            name={name}
            label={label}
            variant="outlined"
            type={showPassword ? "text" : "password"}
            error={error}
            helperText={helperText}
            autoComplete={autoComplete}
            required={required}
            fullWidth={fullWidth}
            sx={sx}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={`toggle ${name} visibility`}
                                onClick={onToggleVisibility}
                                edge="end"
                            >
                                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                            </IconButton>
                        </InputAdornment>
                    ),
                    onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
                    onCut: (e: React.ClipboardEvent) => e.preventDefault(),
                    onPaste: (e: React.ClipboardEvent) => e.preventDefault(),
                },
            }}
        />
    );
};
