const { CertificateTemplate, User, Certificate, Course, TemplateCourse } = require('../models');
const { Op } = require('sequelize');
const { generateCertificatePDF } = require('../services/certificateService');

// Strip raw base64 signature from template response — hasSignature comes from creator user
const sanitizeTemplate = (tpl) => {
  const plain = tpl.get ? tpl.get({ plain: true }) : { ...tpl };
  // hasSignature based on creator's signature (moved from template to user)
  plain.hasSignature = !!(plain.creator?.instructorSignature);
  if (plain.creator) delete plain.creator.instructorSignature;
  delete plain.instructorSignature; // legacy field, no longer used
  return plain;
};

// Get all certificate templates — admins see all, instructors see only their own
exports.getAllTemplates = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? {} : { createdBy: req.user.id };

    const templates = await CertificateTemplate.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: ['isActive'] } }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, templates: templates.map(sanitizeTemplate) });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active template — admins see global active, instructors see their own active
exports.getActiveTemplate = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? { isActive: true } : { isActive: true, createdBy: req.user.id };

    const template = await CertificateTemplate.findOne({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!template) {
      return res.json({ success: true, template: null, message: 'No active template found' });
    }

    res.json({ success: true, template: sanitizeTemplate(template) });
  } catch (error) {
    console.error('Get active template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, template: sanitizeTemplate(template) });
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new template
exports.createTemplate = async (req, res) => {
  try {
    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      isActive,
      courseIds
    } = req.body;

    // If setting as active, deactivate other templates
    if (isActive) {
      await CertificateTemplate.update({ isActive: false }, { where: {} });
    }

    const template = await CertificateTemplate.create({
      name: name || 'New Template',
      primaryColor: primaryColor || '#C9A84C',
      secondaryColor: secondaryColor || '#7EC8E3',
      backgroundColor: backgroundColor || null,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      isActive: isActive || false,
      createdBy: req.user.id
    });

    // Associate courses if provided
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      await template.setCourses(courseIds);
    }

    // Fetch template with courses
    const templateWithCourses = await CertificateTemplate.findByPk(template.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.status(201).json({ success: true, template: sanitizeTemplate(templateWithCourses) });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      courseIds
    } = req.body;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (primaryColor !== undefined) template.primaryColor = primaryColor;
    if (secondaryColor !== undefined) template.secondaryColor = secondaryColor;
    if (backgroundColor !== undefined) template.backgroundColor = backgroundColor || null;
    if (fontFamily !== undefined) template.fontFamily = fontFamily;
    if (titleText !== undefined) template.titleText = titleText;
    if (subtitleText !== undefined) template.subtitleText = subtitleText;
    if (footerText !== undefined) template.footerText = footerText;

    await template.save();

    // Update course associations if provided
    if (courseIds !== undefined) {
      if (Array.isArray(courseIds)) {
        await template.setCourses(courseIds);
      }
    }

    // Fetch updated template with courses
    const updatedTemplate = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.json({ success: true, template: sanitizeTemplate(updatedTemplate) });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate template globally (set as default active - for backward compatibility)
exports.activateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Deactivate all other templates globally
    await CertificateTemplate.update({ isActive: false }, { where: {} });

    // Activate this template
    template.isActive = true;
    await template.save();

    res.json({ success: true, template: sanitizeTemplate(template), message: 'Template activated as default successfully' });
  } catch (error) {
    console.error('Activate template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate template for specific courses
exports.activateTemplateForCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseIds } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds array is required' });
    }

    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (courseIds.length === 0) {
      // Unassign this template from all courses
      await TemplateCourse.update(
        { isActive: false },
        { where: { templateId: id } }
      );
    } else {
      // Deactivate other templates for the newly selected courses (allows reassignment)
      await TemplateCourse.update(
        { isActive: false },
        { where: { courseId: courseIds } }
      );

      // Deactivate this template for courses that were deselected
      await TemplateCourse.update(
        { isActive: false },
        { where: { templateId: id, courseId: { [Op.notIn]: courseIds } } }
      );

      // Activate this template for the specified courses
      for (const courseId of courseIds) {
        const existing = await TemplateCourse.findOne({
          where: { templateId: id, courseId }
        });

        if (existing) {
          existing.isActive = true;
          await existing.save();
        } else {
          await TemplateCourse.create({
            templateId: id,
            courseId,
            isActive: true
          });
        }
      }
    }

    // Fetch updated template with courses
    const updatedTemplate = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: ['isActive'] } }
      ]
    });

    const count = courseIds.length;
    res.json({
      success: true,
      template: sanitizeTemplate(updatedTemplate),
      message: count === 0 ? 'Template unassigned from all courses' : `Template activated for ${count} course(s)`
    });
  } catch (error) {
    console.error('Activate template for courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active templates per course — scoped to instructor's own courses
exports.getActiveTemplatesPerCourse = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    const activeAssignments = await TemplateCourse.findAll({
      where: { isActive: true },
      include: [
        {
          model: CertificateTemplate,
          as: 'template',
          attributes: ['id', 'name', 'primaryColor', 'secondaryColor']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name'],
          ...(isAdmin ? {} : { where: { userId: req.user.id }, required: true })
        }
      ]
    });

    const templateWhere = isAdmin ? { isActive: true } : { isActive: true, createdBy: req.user.id };
    const defaultTemplate = await CertificateTemplate.findOne({
      where: templateWhere,
      attributes: ['id', 'name', 'primaryColor', 'secondaryColor']
    });

    res.json({
      success: true,
      activeAssignments,
      defaultTemplate
    });
  } catch (error) {
    console.error('Get active templates per course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await template.destroy();

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save instructor handwritten signature — stored on the User, applies to all their templates
exports.saveSignature = async (req, res) => {
  try {
    const { signatureData } = req.body;

    if (!signatureData || !signatureData.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ error: 'Invalid signature data. Expected a base64 PNG.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.instructorSignature = signatureData;
    await user.save();

    res.json({ success: true, hasSignature: true, message: 'Signature saved successfully' });
  } catch (error) {
    console.error('Save signature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear instructor signature from user record
exports.clearSignature = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.instructorSignature = null;
    await user.save();

    res.json({ success: true, hasSignature: false, message: 'Signature cleared' });
  } catch (error) {
    console.error('Clear signature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get own signature (for instructor/admin to see their current signature)
exports.getOwnSignature = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'instructorSignature']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, signatureDataUri: user.instructorSignature || null });
  } catch (error) {
    console.error('Get own signature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Preview certificate with sample data
exports.previewCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    let template = null;
    if (id) {
      template = await CertificateTemplate.findByPk(id);
    } else {
      // Use active template
      template = await CertificateTemplate.findOne({ where: { isActive: true } });
    }

    // Convert Sequelize model to plain object
    const templateData = template ? template.get({ plain: true }) : null;

    // Get creator's signature for the preview
    let instructorSignature = null;
    if (templateData?.createdBy) {
      const creator = await User.findByPk(templateData.createdBy, { attributes: ['instructorSignature'] });
      instructorSignature = creator?.instructorSignature || null;
    }

    // Sample data for preview
    const sampleData = {
      studentName: 'John Doe',
      courseName: 'Advanced JavaScript Development',
      certificateNumber: 'CERT-PREVIEW-123456',
      issueDate: new Date(),
      instructorSignature,
    };

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(sampleData, templateData);

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=certificate-preview.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get certificate statistics — scoped to instructor's own courses/templates
exports.getCertificateStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // For instructors: only count certs for their own courses
    const courseWhere = isAdmin ? {} : { userId: req.user.id };
    const courseInclude = {
      model: Course, as: 'course', attributes: ['id', 'name'],
      where: isAdmin ? undefined : courseWhere,
      required: !isAdmin,
    };

    const totalCertificates = isAdmin
      ? await Certificate.count()
      : await Certificate.count({ include: [courseInclude] });

    const recentCertificates = await Certificate.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        courseInclude,
      ]
    });

    const templateWhere = isAdmin ? { isActive: true } : { isActive: true, createdBy: req.user.id };
    const activeTemplate = await CertificateTemplate.findOne({ where: templateWhere });

    res.json({
      success: true,
      stats: {
        totalCertificates,
        hasActiveTemplate: !!activeTemplate,
        activeTemplateId: activeTemplate?.id || null
      },
      recentCertificates
    });
  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get instructor signature image for a template
// Accessible to: admin/superadmin always; expert if they own it; student if they have an earned certificate
exports.getSignatureImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.query; // optional: courseId to verify student access

    const template = await CertificateTemplate.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'instructorSignature'] }]
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    const signature = template.creator?.instructorSignature || null;
    if (!signature) return res.json({ success: true, signatureDataUri: null });

    const role = req.user.role;

    // Admin/superadmin: always allowed
    if (role === 'admin' || role === 'superadmin') {
      return res.json({ success: true, signatureDataUri: signature });
    }

    // Expert/instructor: only their own templates
    if (role === 'expert' || role === 'instructor') {
      if (template.createdBy !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      return res.json({ success: true, signatureDataUri: signature });
    }

    // Student: must have earned a certificate for the given courseId
    if (role === 'student') {
      if (!courseId) return res.status(400).json({ error: 'courseId required for student access' });
      const cert = await Certificate.findOne({ where: { userId: req.user.id, courseId } });
      if (!cert) return res.status(403).json({ error: 'Access denied' });
      return res.json({ success: true, signatureDataUri: signature });
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Get signature image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template for a specific course
exports.getTemplateForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // First, check for a course-specific active template assignment
    const activeAssignment = await TemplateCourse.findOne({
      where: { courseId, isActive: true }
    });

    if (activeAssignment) {
      const template = await CertificateTemplate.findByPk(activeAssignment.templateId, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] }
        ]
      });
      if (template) {
        return res.json({ success: true, template: sanitizeTemplate(template), source: 'course-specific' });
      }
    }

    // Fall back to the global default active template
    const defaultTemplate = await CertificateTemplate.findOne({
      where: { isActive: true },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'instructorSignature'] }
      ]
    });

    if (defaultTemplate) {
      return res.json({ success: true, template: sanitizeTemplate(defaultTemplate), source: 'default' });
    }

    return res.json({ success: true, template: null, message: 'No template found for this course' });
  } catch (error) {
    console.error('Get template for course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;
