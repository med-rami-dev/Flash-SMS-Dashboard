import { QAItem } from '../types/qa';

export const qaData: QAItem[] = [
    {
        id: '1',
        question: 'What is Flash SMS?',
        answer: 'Flash SMS is a type of SMS that appears directly on the recipient\'s screen without requiring them to open it.',
        category: 'General',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isActive: true,
        tags: ['sms', 'flash', 'basics']
    },
    {
        id: '2',
        question: 'How do I send a Flash SMS?',
        answer: 'To send a Flash SMS, you need to use our API endpoint with the appropriate parameters and authentication.',
        category: 'Technical',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        isActive: true,
        tags: ['api', 'sending', 'technical']
    },
    {
        id: '3',
        question: 'What are the pricing plans?',
        answer: 'We offer various pricing plans based on volume and features. Please check our pricing page for detailed information.',
        category: 'Billing',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        isActive: true,
        tags: ['pricing', 'billing', 'plans']
    }
]; 