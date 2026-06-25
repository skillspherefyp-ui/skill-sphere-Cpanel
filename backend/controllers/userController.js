const { User, Enrollment, Course } = require('../models');
const { Op } = require('sequelize');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const canManageAllStudents = req.user.permissions?.canManageStudents === true;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();

    const baseWhere = { role: 'student' };
    if (search) {
      baseWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    let result;

    if (isAdmin || canManageAllStudents) {
      result = await User.findAndCountAll({
        where: baseWhere,
        attributes: ['id', 'name', 'email', 'phone', 'isActive', 'profilePicture', 'lastLogin', 'age', 'qualification', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
    } else {
      // Instructors can only see students enrolled in their courses
      const enrollments = await Enrollment.findAll({
        attributes: ['userId'],
        include: [{
          model: Course,
          as: 'course',
          where: { userId: req.user.id },
          attributes: []
        }]
      });

      const studentIds = [...new Set(enrollments.map(e => e.userId))];

      if (studentIds.length > 0) {
        result = await User.findAndCountAll({
          where: { ...baseWhere, id: { [Op.in]: studentIds } },
          attributes: ['id', 'name', 'email', 'phone', 'isActive', 'profilePicture', 'lastLogin', 'age', 'qualification', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit,
          offset,
        });
      } else {
        result = { count: 0, rows: [] };
      }
    }

    res.json({
      success: true,
      students: result.rows,
      total: result.count,
      page,
      totalPages: Math.ceil(result.count / limit),
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all experts
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await User.findAll({
      where: { role: 'expert' },
      attributes: ['id', 'name', 'email', 'phone', 'isActive', 'permissions', 'profilePicture', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, experts });
  } catch (error) {
    console.error('Get experts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Enrollment,
        as: 'enrollments',
        attributes: ['id', 'progressPercentage', 'status', 'enrolledAt', 'completedAt'],
        include: [{
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'thumbnailImage', 'language', 'level'],
        }],
      }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, permissions, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update admin' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    await user.update({
      name: name ?? user.name,
      email: email ?? user.email,
      phone: phone ?? user.phone,
      role: role ?? user.role,
      permissions: permissions ?? user.permissions,
      isActive: typeof isActive === 'boolean' ? isActive : user.isActive
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const targetUserId = req.params.id ? Number(req.params.id) : null;
    const baseWhere = {};

    if (targetUserId) {
      baseWhere.userId = targetUserId;
    }

    const [totalEnrollments, completedEnrollments] = await Promise.all([
      Enrollment.count({ where: baseWhere }),
      Enrollment.count({ where: { ...baseWhere, status: 'completed' } })
    ]);

    res.json({
      success: true,
      stats: {
        totalEnrollments,
        completedEnrollments,
        activeEnrollments: totalEnrollments - completedEnrollments
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot toggle admin status
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot modify admin status' });
    }

    // Check permissions for student management
    if (user.role === 'student') {
      const isAdmin = req.user.role === 'admin';
      const canManageAllStudents = req.user.permissions?.canManageStudents === true;

      if (!isAdmin && !canManageAllStudents) {
        // Instructor without full permission can only toggle students enrolled in their courses
        const enrollment = await Enrollment.findOne({
          where: { userId: id },
          include: [{
            model: Course,
            as: 'course',
            where: { userId: req.user.id },
            attributes: ['id', 'name']
          }]
        });

        if (!enrollment) {
          return res.status(403).json({
            error: 'You can only manage students enrolled in your courses'
          });
        }
      }
    }

    // Toggle the status
    user.isActive = !user.isActive;
    await user.save();

    console.log(`✅ User ${user.email} status toggled to ${user.isActive ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot delete admin
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin' });
    }

    await user.destroy();

    console.log(`✅ User ${user.email} deleted successfully`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk actions on users
exports.bulkAction = async (req, res) => {
  try {
    const { action, userIds } = req.body;
    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'action and userIds are required' });
    }
    if (action === 'activate') {
      await User.update({ isActive: true }, { where: { id: userIds } });
    } else if (action === 'deactivate') {
      await User.update({ isActive: false }, { where: { id: userIds } });
    } else if (action === 'delete') {
      await User.destroy({ where: { id: userIds } });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use: activate, deactivate, delete' });
    }
    res.json({ success: true, message: `Bulk ${action} applied to ${userIds.length} users` });
  } catch (err) {
    console.error('Bulk action error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export students as CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'phone', 'isActive', 'profilePicture', 'lastLogin', 'age', 'qualification', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    const header = 'ID,Name,Email,Phone,Active,Joined\n';
    const rows = students.map(s =>
      `${s.id},"${s.name}","${s.email}","${s.phone || ''}",${s.isActive},${new Date(s.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(header + rows);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
