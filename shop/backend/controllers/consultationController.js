const Consultation = require('../models/Consultation');

let sseClients = [];

const notifyClients = () => {
    sseClients.forEach(client => {
        try {
            client.write(`data: REFRESH\n\n`);
        } catch(e) {
            console.error('SSE send error:', e);
        }
    });
};

// @desc    Create new consultation request
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
    const { name, email, phone, service, date, time, notes, userId } = req.body;

    if (!name || !phone) {
        res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên và Số điện thoại)' });
        return;
    }

    const consultation = await Consultation.create({
        name,
        email,
        phone,
        service,
        date,
        time,
        notes,
        user: userId || undefined
    });

    if (consultation) {
        notifyClients();
        res.status(201).json(consultation);
    } else {
        res.status(400).json({ message: 'Dữ liệu yêu cầu không hợp lệ' });
    }
};

// @desc    Get all consultations
// @route   GET /api/admin/consultations
// @access  Private (Admin/Staff)
const getConsultations = async (req, res) => {
    const consultations = await Consultation.find({}).sort({ createdAt: -1 });
    res.json(consultations);
};

// @desc    Update consultation status
// @route   PUT /api/admin/consultations/:id/status
// @access  Private (Admin/Staff)
const updateConsultationStatus = async (req, res) => {
    const { status } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        consultation.status = status || consultation.status;
        const updated = await consultation.save();
        notifyClients();
        res.json(updated);
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

// @desc    Update full consultation details (name, email, phone, service, notes)
// @route   PUT /api/admin/consultations/:id
// @access  Private (Admin/Staff)
const updateConsultationDetails = async (req, res) => {
    const { name, email, phone, service, notes } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        consultation.name = name || consultation.name;
        consultation.email = email !== undefined ? email : consultation.email;
        consultation.phone = phone || consultation.phone;
        consultation.service = service || consultation.service;
        consultation.notes = notes !== undefined ? notes : consultation.notes;

        const updated = await consultation.save();
        notifyClients();
        res.json(updated);
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

// @desc    Delete consultation
// @route   DELETE /api/admin/consultations/:id
// @access  Private (Admin only)
const deleteConsultation = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        await consultation.deleteOne();
        res.json({ message: 'Đã xóa yêu cầu tư vấn thành công' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

const handleSseStream = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
    sseClients.push(res);
    req.on('close', () => {
        sseClients = sseClients.filter(c => c !== res);
    });
};

const getMyConsultations = async (req, res) => {
    const consultations = await Consultation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(consultations);
};

const getConsultationById = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }
    if (consultation.user && consultation.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'Không có quyền truy cập yêu cầu này' });
        return;
    }
    res.json(consultation);
};

const getConsultationByIdForStaff = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }
    res.json(consultation);
};

const sendCustomerMessage = async (req, res) => {
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
        return;
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }

    if (consultation.user && consultation.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'Không có quyền truy cập yêu cầu này' });
        return;
    }

    if (!consultation.messages) {
        consultation.messages = [];
    }

    consultation.messages.push({
        sender: 'customer',
        senderName: req.user.name,
        content: content,
        timestamp: new Date()
    });

    await consultation.save();
    notifyClients();
    res.status(201).json(consultation);
};

const sendStaffMessage = async (req, res) => {
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
        return;
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }

    if (!consultation.messages) {
        consultation.messages = [];
    }

    consultation.messages.push({
        sender: 'staff',
        senderName: req.user.name,
        content: content,
        timestamp: new Date()
    });

    await consultation.save();
    notifyClients();
    res.status(201).json(consultation);
};

module.exports = {
    createConsultation,
    getConsultations,
    updateConsultationStatus,
    updateConsultationDetails,
    deleteConsultation,
    handleSseStream,
    getMyConsultations,
    getConsultationById,
    getConsultationByIdForStaff,
    sendCustomerMessage,
    sendStaffMessage
};
