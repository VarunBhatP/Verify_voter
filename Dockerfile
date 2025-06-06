FROM node:18-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files first for better cache optimization
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Create models directory and add all required model files
RUN mkdir -p src/models && \
    echo "const mongoose = require('mongoose'); const bcrypt = require('bcryptjs'); const userSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true }, adharNumber: { type: String }, phoneNumber: { type: String, required: true, unique: true }, voterId: { type: String, required: true, unique: true }, phoneNumberVerified: { type: Boolean, default: false }, faceEmbedding: { type: Array, required: false }, digitalToken: { type: String, unique: true, sparse: true }, timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', default: null }, isAdmin: { type: Boolean, default: false }, faceVerifiedAt: { type: Date, default: null }, tokenVerifiedAt: { type: Date, default: null } }, { timestamps: true }); userSchema.pre('save', async function(next) { if (!this.isModified('password')) { return next(); } try { const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); next(); } catch (error) { next(error); } }); const User = mongoose.models.User || mongoose.model('User', userSchema); module.exports = User;" > src/models/userModel.js && \
    echo "const mongoose = require('mongoose'); const timeSlotSchema = new mongoose.Schema({ date: { type: Date, required: true }, startTime: { type: String, required: true }, endTime: { type: String, required: true }, maxAppointments: { type: Number, default: 10 }, currentBookings: { type: Number, default: 0 } }, { timestamps: true }); const TimeSlot = mongoose.models.TimeSlot || mongoose.model('TimeSlot', timeSlotSchema); module.exports = TimeSlot;" > src/models/TimeSlot.js && \
    echo "const mongoose = require('mongoose'); const DigitalToken = mongoose.models.DigitalToken || mongoose.model('DigitalToken', new mongoose.Schema({ voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, token: { type: String, required: true }, qrCode: { type: String, required: true }, pdfData: { type: String, required: true }, generatedAt: { type: Date, default: Date.now, required: true }, verifiedAt: { type: Date }, status: { type: String, enum: ['active', 'used', 'expired', 'revoked'], default: 'active' } }, { timestamps: true })); module.exports = DigitalToken;" > src/models/DigitalToken.js && \
    echo "const mongoose = require('mongoose'); const DigitalToken = mongoose.models.DigitalToken || mongoose.model('DigitalToken', new mongoose.Schema({ voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, token: { type: String, required: true }, qrCode: { type: String, required: true }, pdfData: { type: String, required: true }, generatedAt: { type: Date, default: Date.now, required: true }, verifiedAt: { type: Date }, status: { type: String, enum: ['active', 'used', 'expired', 'revoked'], default: 'active' } }, { timestamps: true })); module.exports = DigitalToken;" > src/models/digitalTokenModel.js && \
    echo "const mongoose = require('mongoose'); const chatMessageSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, room: { type: String, required: true }, text: { type: String, required: true }, sender: { type: String, required: true } }, { timestamps: true }); const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema); module.exports = ChatMessage;" > src/models/ChatMessage.js && \
    echo "const mongoose = require('mongoose'); const chatbotHistorySchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, roomId: { type: String, required: true }, messages: [{ role: { type: String, enum: ['user', 'bot'], required: true }, content: { type: String, required: true }, timestamp: { type: Date, default: Date.now } }] }, { timestamps: true }); const ChatbotHistory = mongoose.models.ChatbotHistory || mongoose.model('ChatbotHistory', chatbotHistorySchema); module.exports = ChatbotHistory;" > src/models/chatbotModel.js

# Set environment variables
ENV NODE_ENV=production

# Set environment variable for the port
ENV PORT=8080

# Expose the port
EXPOSE $PORT

# Add healthcheck with more time
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Command to run the application
CMD ["node", "server.js"]