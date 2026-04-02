const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const bcrypt = require('bcryptjs');

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            include: { district: true },
        });

        if (!user || user.deletedAt) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('--- DEBUG JWT ---');
        console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Undefined', `'${process.env.JWT_SECRET}'`);
        console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'Defined' : 'Undefined', `'${process.env.JWT_REFRESH_SECRET}'`);

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.TOKEN_EXPIRY || '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        const { password: _password, refreshToken: _, ...safeUser } = user;

        res.json({ token, refreshToken, user: safeUser });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || user.refreshToken !== refreshToken || user.deletedAt) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const newToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.TOKEN_EXPIRY || '15m' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        next(err);
    }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null },
        });
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                district: true,
                lastSelectedCourt: true,
            },
        });

        const { password, refreshToken, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/auth/change-password
router.put('/change-password', authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (currentPassword !== user.password) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: newPassword },
        });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/auth/users (For Developer Only)
router.get('/users', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true, username: true, name: true, role: true, districtId: true },
            orderBy: { name: 'asc' }
        });
        res.json({ users });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/auth/reset-passwords
router.post('/reset-passwords', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const { scope, districtId, userId } = req.body;
        
        if (scope === 'all') {
            await prisma.user.updateMany({ where: { role: 'developer' }, data: { password: 'admin123' } });
            await prisma.user.updateMany({ where: { role: 'state_admin' }, data: { password: 'state123' } });
            await prisma.user.updateMany({ where: { role: 'district_admin' }, data: { password: 'district123' } });
            await prisma.user.updateMany({ where: { role: { in: ['viewer_district', 'viewer_state'] } }, data: { password: 'viewer123' } });
            await prisma.user.updateMany({ where: { role: 'naib_court' }, data: { password: 'Welcome@123' } });
            return res.json({ message: 'All passwords have been successfully reset to defaults.' });
        } 
        else if (scope === 'district' && districtId) {
            await prisma.user.updateMany({ 
                where: { districtId: parseInt(districtId), role: 'district_admin' }, 
                data: { password: 'district123' } 
            });
            await prisma.user.updateMany({ 
                where: { districtId: parseInt(districtId), role: 'viewer_district' }, 
                data: { password: 'viewer123' } 
            });
            await prisma.user.updateMany({ 
                where: { districtId: parseInt(districtId), role: 'naib_court' }, 
                data: { password: 'Welcome@123' } 
            });
            return res.json({ message: 'Passwords for the selected district have been reset.' });
        }
        else if (scope === 'user' && userId) {
            const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
            if (!user) return res.status(404).json({ error: 'User not found' });
            
            let defaultPwd = 'Welcome@123';
            if (user.role === 'developer') defaultPwd = 'admin123';
            else if (user.role === 'state_admin') defaultPwd = 'state123';
            else if (user.role === 'district_admin') defaultPwd = 'district123';
            else if (['viewer_district', 'viewer_state'].includes(user.role)) defaultPwd = 'viewer123';

            await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { password: defaultPwd }
            });
            return res.json({ message: `Password for ${user.username} has been reset.` });
        }
        
        res.status(400).json({ error: 'Invalid scope or missing parameters.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
