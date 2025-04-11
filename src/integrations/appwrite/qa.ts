import { databases } from './client';
import { Query } from 'appwrite';
import { QAItem } from '@/types/qa';

const DATABASE_ID = '67f741820018b85a6f1a';
const COLLECTION_ID = 'questions_and_answer';

export const createQA = async (qa: Omit<QAItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            'unique()',
            {
                question: qa.question,
                answer: qa.answer,
                category: qa.category,
                tags: qa.tags,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            id: response.$id,
            ...qa,
            createdAt: new Date(response.$createdAt),
            updatedAt: new Date(response.$updatedAt),
        };
    } catch (error) {
        console.error('Error creating Q&A:', error);
        throw error;
    }
};

export const getQAs = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.orderDesc('$createdAt'),
            ]
        );

        return response.documents.map(doc => ({
            id: doc.$id,
            question: doc.question,
            answer: doc.answer,
            category: doc.category,
            tags: doc.tags,
            isActive: doc.isActive,
            createdAt: new Date(doc.$createdAt),
            updatedAt: new Date(doc.$updatedAt),
        }));
    } catch (error) {
        console.error('Error fetching Q&As:', error);
        throw error;
    }
};

export const updateQA = async (id: string, qa: Partial<QAItem>) => {
    try {
        const response = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id,
            {
                ...qa,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            id: response.$id,
            question: response.question,
            answer: response.answer,
            category: response.category,
            tags: response.tags,
            isActive: response.isActive,
            createdAt: new Date(response.$createdAt),
            updatedAt: new Date(response.$updatedAt),
        };
    } catch (error) {
        console.error('Error updating Q&A:', error);
        throw error;
    }
};

export const deleteQA = async (id: string) => {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        );
    } catch (error) {
        console.error('Error deleting Q&A:', error);
        throw error;
    }
}; 