import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const BackButton = ({ children = "Volver", onClick, sx = {} }) => (
    <Button
        onClick={onClick}
        startIcon={<ArrowBackIcon />}
        disableElevation
        sx={{
            mb: 3,
            color: 'var(--primary)',
            bgcolor: 'rgba(250, 79, 22, 0.08)',
            borderRadius: 999,
            px: 2.5,
            py: 0.85,
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
                bgcolor: 'var(--primary)',
                color: '#fff',
                transform: 'translateX(-3px)',
                boxShadow: '0 6px 14px rgba(250, 79, 22, 0.3)',
            },
            ...sx
        }}
    >
        {children}
    </Button>
);

export default BackButton;
