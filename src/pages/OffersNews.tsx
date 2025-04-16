import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { storage, databases } from '@/integrations/appwrite/client';
import { ID, Models, Permission, Role } from 'appwrite';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useToast } from "@/hooks/use-toast";

// Appwrite constants
const APPWRITE_BUCKET_ID = 'media';
const APPWRITE_DATABASE_ID = 'flash_sms';
const APPWRITE_COLLECTION_ID = 'offers_news';

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          <h2>Something went wrong.</h2>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface OfferNews extends Models.Document {
  title: string;
  content: string;
  created_at: Date;
  image_id: string; // Changed from image_url to image_id
  is_offer: boolean;
  btn_url_action: string;
  btn_text: string;
}

const OffersNews: React.FC = () => {
  const [items, setItems] = useState<OfferNews[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<OfferNews | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [btnUrlAction, setBtnUrlAction] = useState('');
  const [btnText, setBtnText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments<OfferNews>(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67'
      );
      setItems(response.documents);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToAppwrite = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      const fileId = ID.unique();
      const response = await storage.createFile(
        APPWRITE_BUCKET_ID,
        fileId,
        file,
        [
          Permission.read(Role.users()), // Grants read access to all authenticated users
          Permission.write(Role.users()), // Grants write access to all authenticated users
          Permission.delete(Role.users()), // Grants delete access to all authenticated users
          Permission.update(Role.users()), // Grants update access to all authenticated users
        ]
      );
      return response.$id;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (fileId: string): string => {
    if (!fileId) return '';
    try {
      const fileView = storage.getFileView(APPWRITE_BUCKET_ID, fileId);
      return fileView.toString();
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError(null);
      let imageId = '';

      if (imageFile) {
        try {
          imageId = await uploadImageToAppwrite(imageFile);
        } catch (error) {
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      const newItem = {
        title,
        content,
        created_at: new Date().toISOString(),
        image_id: imageId, // Store the file ID instead of URL
        is_offer: isOffer,
        btn_url_action: btnUrlAction,
        btn_text: btnText,
      };

      await databases.createDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        ID.unique(),
        newItem
      );

      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setIsOffer(false);
      setBtnUrlAction('');
      setBtnText('');
      setShowModal(false);
      fetchItems();

      toast({
        title: "Success",
        description: `${isOffer ? 'Offer' : 'News'} added successfully`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item. Please try again.');
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: OfferNews) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    // If there's an image_id, generate the preview URL
    if (item.image_id) {
      setImagePreview(getImageUrl(item.image_id));
    } else {
      setImagePreview(null);
    }
    setIsOffer(item.is_offer);
    setBtnUrlAction(item.btn_url_action);
    setBtnText(item.btn_text);
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem || !currentUser) return;

    try {
      setError(null);
      let imageId = editingItem.image_id;

      if (imageFile) {
        try {
          imageId = await uploadImageToAppwrite(imageFile);
        } catch (error) {
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      await databases.updateDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        editingItem.$id,
        {
          title,
          content,
          image_id: imageId, // Store the file ID instead of URL
          is_offer: isOffer,
          btn_url_action: btnUrlAction,
          btn_text: btnText,
          updated_at: new Date().toISOString()
        }
      );

      setShowModal(false);
      setEditingItem(null);
      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setIsOffer(false);
      setBtnUrlAction('');
      setBtnText('');
      fetchItems();

      toast({
        title: "Success",
        description: `${isOffer ? 'Offer' : 'News'} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item. Please try again.');
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      // First get the document to access the image_id
      const document = await databases.getDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        id
      );

      // If there's an image_id, delete the image from storage
      if (document.image_id) {
        try {
          await storage.deleteFile(APPWRITE_BUCKET_ID, document.image_id);
        } catch (error) {
          console.error('Error deleting image from storage:', error);
          // Continue even if image deletion fails
        }
      }

      // Delete the document from database
      await databases.deleteDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        id
      );

      fetchItems();

      toast({
        title: "Success",
        description: `${document.is_offer ? 'Offer' : 'News'} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initiateDelete = (id: string) => {
    setDeleteItemId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId || !currentUser) return;

    try {
      // First get the document to access the image_id
      const document = await databases.getDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        deleteItemId
      );

      // If there's an image_id, delete the image from storage
      if (document.image_id) {
        try {
          await storage.deleteFile(APPWRITE_BUCKET_ID, document.image_id);
        } catch (error) {
          console.error('Error deleting image from storage:', error);
          // Continue even if image deletion fails
        }
      }

      // Delete the document from database
      await databases.deleteDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        deleteItemId
      );

      fetchItems();
      setShowDeleteDialog(false);
      setDeleteItemId(null);

      toast({
        title: "Success",
        description: `${document.is_offer ? 'Offer' : 'News'} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004aad]"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Offers & News Management</h2>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#004aad] hover:bg-[#003d8a] text-white"
          >
            Add New {isOffer ? 'Offer' : 'News'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.$id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {item.image_id && (
                <div className="relative h-48">
                  <img
                    src={getImageUrl(item.image_id)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.is_offer ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                      {item.is_offer ? 'Offer' : 'News'}
                    </span>
                  </div>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>
                {item.btn_text && item.btn_url_action && (
                  <div className="mb-4">
                    <a
                      href={item.btn_url_action}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#004aad] text-white rounded hover:bg-[#003d8a] transition-colors"
                    >
                      {item.btn_text}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-gray-100"
                      onClick={() => handleEdit(item)}
                    >
                      <FaEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={() => initiateDelete(item.$id)}
                    >
                      <FaTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingItem ? 'Edit' : 'Add New'} {isOffer ? 'Offer' : 'News'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingItem ? handleUpdate : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isOffer"
                      checked={isOffer}
                      onCheckedChange={setIsOffer}
                    />
                    <Label htmlFor="isOffer">This is an offer</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  {uploading && (
                    <div className="text-sm text-gray-500">Uploading image...</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btnText">Button Text</Label>
                  <Input
                    id="btnText"
                    value={btnText}
                    onChange={(e) => setBtnText(e.target.value)}
                    placeholder="e.g., Learn More, Get Started"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btnUrlAction">Button URL Action</Label>
                  <Input
                    id="btnUrlAction"
                    value={btnUrlAction}
                    onChange={(e) => setBtnUrlAction(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-[#004aad] hover:bg-[#003d8a] text-white"
                >
                  {uploading ? 'Uploading...' : (editingItem ? 'Update' : 'Add')} {isOffer ? 'Offer' : 'News'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default OffersNews;
