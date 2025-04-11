import { databases } from './client';
import { ID } from 'appwrite';

const DATABASE_ID = '67f741820018b85a6f1a';
const COLLECTION_ID = 'categories';

export interface Category {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const documentId = ID.unique();
        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            documentId,
            {
                id: documentId,
                name: category.name,
                description: category.description,
                isActive: category.isActive,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            id: response.$id,
            name: response.name,
            description: response.description,
            isActive: response.isActive,
            createdAt: new Date(response.$createdAt),
            updatedAt: new Date(response.$updatedAt),
        };
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

export const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
        const response = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id,
            {
                ...category,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            id: response.$id,
            name: response.name,
            description: response.description,
            isActive: response.isActive,
            createdAt: new Date(response.$createdAt),
            updatedAt: new Date(response.$updatedAt),
        };
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
};

export const deleteCategory = async (id: string) => {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        );
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

export const getCategories = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID
        );

        return response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            isActive: doc.isActive,
            createdAt: new Date(doc.$createdAt),
            updatedAt: new Date(doc.$updatedAt),
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}; 