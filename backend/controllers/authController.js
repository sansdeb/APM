// controllers/authController.js
// Updated: includes employeeId, role in JWT payload
    
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, employeeId, email, role, password } = req.body;

    // 1. Check email isn't already taken
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 2. Check employeeId isn't already taken
    const existingEmpId = await User.findOne({ where: { employeeId } });
    if (existingEmpId) {
      return res.status(400).json({ message: 'Employee ID already registered' });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save user — 
    const user = await User.create({
      name,
      employeeId,
      email,
      role:'requester',
      password: hashedPassword,
    });

    // 5. Sign JWT 
    const token = jwt.sign(
      { id: user.id, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        employeeId: user.employeeId,
        role:       user.role,         // frontend uses this to redirect
      },
    });
 
  } catch (err) {
    // Sequelize ENUM violation — invalid role value sent
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid role selected' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Issue token 
    const token = jwt.sign(
      { id: user.id, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        employeeId: user.employeeId,
        role:       user.role,
      },
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};