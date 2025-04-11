export interface QAItem {
    id: string;
    question: string;
    answer: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    tags: string[];
}

export interface QACollection {
    items: QAItem[];
    total: number;
    page: number;
    pageSize: number;
} 