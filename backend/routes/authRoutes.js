import express from 'express';
import { 
    checkAuth, 
    forgotPassword, 
    login, 
    logout, 
    resendVerificationEmail, 
    resetPassword, 
    signup, 
    updateUserRole, 
    verifyEmail,
    updateUserProfile,
    adminUpdateUserProfile,
    getAllUsers,
    addNewIntern,
    deleteIntern,
    sendCompletionEmailController
} from '../controllers/authControllers.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();


router.get('/check-auth', verifyToken, checkAuth);
router.get('/get-all-users', verifyToken, getAllUsers);
router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/add-new-intern', verifyToken, addNewIntern);
router.post('/send-completion-email', sendCompletionEmailController);
router.put('/update-user-role', verifyToken, updateUserRole);
router.put('/update-user-profile', verifyToken, uploadMiddleware, updateUserProfile);
router.put('/update-other-user-profile/:id', verifyToken, adminUpdateUserProfile);
router.delete('/delete-intern/:internId',verifyToken, deleteIntern);

export default router; 