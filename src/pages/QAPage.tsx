import React, { useState, useEffect } from 'react';
import { QAItem } from '../types/qa';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createQA, getQAs, updateQA, deleteQA } from '@/integrations/appwrite/qa';
import { createCategory, getCategories, updateCategory, deleteCategory, Category } from '@/integrations/appwrite/categories';
import { motion, AnimatePresence } from 'framer-motion';

const QAPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [qaItems, setQAItems] = useState<QAItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingQA, setEditingQA] = useState<QAItem | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const { toast } = useToast();

    const [newQA, setNewQA] = useState({
        question: '',
        answer: '',
        category: 'General',
        tags: [] as string[],
        isActive: true,
    });

    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        isActive: true,
    });

    useEffect(() => {
        fetchQAs();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const items = await getCategories();
            setCategories(items);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch categories",
                variant: "destructive",
            });
        }
    };

    const fetchQAs = async () => {
        try {
            setIsLoading(true);
            const items = await getQAs();
            setQAItems(items);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch Q&A items",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        try {
            if (!newCategory.name) {
                toast({
                    title: "Error",
                    description: "Please enter a category name",
                    variant: "destructive",
                });
                return;
            }

            const createdCategory = await createCategory(newCategory);
            setCategories(prev => [...prev, createdCategory]);
            setNewQA(prev => ({ ...prev, category: createdCategory.name }));

            toast({
                title: "Success",
                description: "Category created successfully",
            });

            setIsCategoryDialogOpen(false);
            setNewCategory({
                name: '',
                description: '',
                isActive: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create category",
                variant: "destructive",
            });
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;

        try {
            const updatedCategory = await updateCategory(editingCategory.id, {
                name: newCategory.name,
                description: newCategory.description,
                isActive: newCategory.isActive,
            });

            setCategories(prev => prev.map(cat =>
                cat.id === updatedCategory.id ? updatedCategory : cat
            ));

            toast({
                title: "Success",
                description: "Category updated successfully",
            });

            setIsCategoryDialogOpen(false);
            setEditingCategory(null);
            setNewCategory({
                name: '',
                description: '',
                isActive: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update category",
                variant: "destructive",
            });
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
            toast({
                title: "Success",
                description: "Category deleted successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "destructive",
            });
        }
    };

    const handleCreateQA = async () => {
        try {
            if (!newQA.question || !newQA.answer) {
                toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive",
                });
                return;
            }

            const createdQA = await createQA(newQA);
            setQAItems(prev => [createdQA, ...prev]);

            toast({
                title: "Success",
                description: "Q&A item created successfully",
            });

            setIsDialogOpen(false);
            setNewQA({
                question: '',
                answer: '',
                category: 'General',
                tags: [],
                isActive: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create Q&A item",
                variant: "destructive",
            });
        }
    };

    const handleUpdateQA = async () => {
        if (!editingQA) return;

        try {
            const updatedQA = await updateQA(editingQA.id, {
                question: newQA.question,
                answer: newQA.answer,
                category: newQA.category,
                tags: newQA.tags,
                isActive: newQA.isActive,
            });

            setQAItems(prev => prev.map(qa =>
                qa.id === updatedQA.id ? updatedQA : qa
            ));

            toast({
                title: "Success",
                description: "Q&A item updated successfully",
            });

            setIsDialogOpen(false);
            setEditingQA(null);
            setNewQA({
                question: '',
                answer: '',
                category: 'General',
                tags: [],
                isActive: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update Q&A item",
                variant: "destructive",
            });
        }
    };

    const handleDeleteQA = async (id: string) => {
        try {
            await deleteQA(id);
            setQAItems(prev => prev.filter(qa => qa.id !== id));
            toast({
                title: "Success",
                description: "Q&A item deleted successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete Q&A item",
                variant: "destructive",
            });
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description || '',
            isActive: category.isActive,
        });
        setIsCategoryDialogOpen(true);
    };

    const handleEditQA = (qa: QAItem) => {
        setEditingQA(qa);
        setNewQA({
            question: qa.question,
            answer: qa.answer,
            category: qa.category,
            tags: qa.tags,
            isActive: qa.isActive,
        });
        setIsDialogOpen(true);
    };

    const filteredQA = qaItems.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            item.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#004aad] to-[#0066cc] bg-clip-text text-transparent">
                            Questions & Answers 
                        </h1>
                        <div className="flex gap-2">
                            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 border-[#004aad] text-[#004aad] hover:bg-[#004aad]/10">
                                        <Plus className="w-4 h-4" />
                                        New Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-[#004aad]">{editingCategory ? 'Edit' : 'Create New'} Category</DialogTitle>
                                        <DialogDescription>
                                            {editingCategory ? 'Update' : 'Add'} a category to organize your Q&A items
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="categoryName">Category Name</Label>
                                            <Input
                                                id="categoryName"
                                                value={newCategory.name}
                                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                                placeholder="Enter category name"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="categoryDescription">Description</Label>
                                            <Textarea
                                                id="categoryDescription"
                                                value={newCategory.description}
                                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                                placeholder="Enter category description"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => {
                                            setIsCategoryDialogOpen(false);
                                            setEditingCategory(null);
                                            setNewCategory({
                                                name: '',
                                                description: '',
                                                isActive: true,
                                            });
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                                            {editingCategory ? 'Update' : 'Create'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-2 bg-[#004aad] hover:bg-[#003d8a] text-white">
                                        <Plus className="w-4 h-4" />
                                        New Q&A
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-[#004aad]">{editingQA ? 'Edit' : 'Create New'} Q&A</DialogTitle>
                                        <DialogDescription>
                                            {editingQA ? 'Update' : 'Add'} a new question and answer to your knowledge base
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="question">Question</Label>
                                            <Input
                                                id="question"
                                                value={newQA.question}
                                                onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
                                                placeholder="Enter the question"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="answer">Answer</Label>
                                            <Textarea
                                                id="answer"
                                                value={newQA.answer}
                                                onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
                                                placeholder="Enter the answer"
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="category">Category</Label>
                                            <select
                                                id="category"
                                                value={newQA.category}
                                                onChange={(e) => setNewQA({ ...newQA, category: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.name}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tags">Tags (comma separated)</Label>
                                            <Input
                                                id="tags"
                                                value={newQA.tags.join(', ')}
                                                onChange={(e) => setNewQA({ ...newQA, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                                                placeholder="Enter tags separated by commas"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => {
                                            setIsDialogOpen(false);
                                            setEditingQA(null);
                                            setNewQA({
                                                question: '',
                                                answer: '',
                                                category: 'General',
                                                tags: [],
                                                isActive: true,
                                            });
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={editingQA ? handleUpdateQA : handleCreateQA}>
                                            {editingQA ? 'Update' : 'Create'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search questions..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            className="p-2 border rounded-lg focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad] bg-white"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(category => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-[#004aad]/10"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg text-[#004aad]">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditCategory(category)}
                                        className="text-[#004aad] hover:bg-[#004aad]/20 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-500 hover:bg-red-500/20 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Q&A List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
                            </div>
                        ) : (
                            filteredQA.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-[#004aad]">{item.question}</h3>
                                                <span className="text-xs px-2 py-1 bg-[#004aad]/10 text-[#004aad] rounded-full">
                                                    {item.category}
                                                </span>
                                            </div>
                                            {expandedId === item.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-4"
                                                >
                                                    <p className="text-gray-700">{item.answer}</p>
                                                    {item.tags.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {item.tags.map(tag => (
                                                                <span
                                                                    key={tag}
                                                                    className="px-3 py-1 bg-[#004aad]/10 text-[#004aad] rounded-full text-sm"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditQA(item)}
                                                className="text-[#004aad] hover:bg-[#004aad]/10 rounded-full"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteQA(item.id)}
                                                className="text-red-500 hover:bg-red-500/10 rounded-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default QAPage; 