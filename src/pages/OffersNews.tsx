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
  image_url: string;
  is_offer: boolean;
  btn_url_action: string;
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
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();

  const fetchItems = async () => {
    try {
      const response = await databases.listDocuments<OfferNews>(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67'
      );
      setItems(response.documents);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch items. Please try again.');
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
      let imageUrl = '';

      if (imageFile) {
        try {
          const fileId = await uploadImageToAppwrite(imageFile);
          imageUrl = getImageUrl(fileId);
        } catch (error) {
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      const newItem = {
        title,
        content,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        is_offer: isOffer,
        btn_url_action: btnUrlAction,
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
      fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item. Please try again.');
    }
  };

  const handleEdit = (item: OfferNews) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setImagePreview(item.image_url);
    setIsOffer(item.is_offer);
    setBtnUrlAction(item.btn_url_action);
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem || !currentUser) return;

    try {
      setError(null);
      let imageUrl = editingItem.image_url;

      if (imageFile) {
        try {
          const fileId = await uploadImageToAppwrite(imageFile);
          imageUrl = getImageUrl(fileId);
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
          image_url: imageUrl,
          is_offer: isOffer,
          btn_url_action: btnUrlAction,
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
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      await databases.deleteDocument(
        '67f741820018b85a6f1a',
        '67f74190003a8b05be67',
        id
      );
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
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
              {item.image_url && (
                <div className="relative h-48">
                  <img
                    src={item.image_url}
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
                      onClick={() => handleDelete(item.$id)}
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
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btnUrlAction">Button URL Action</Label>
                  <Input
                    id="btnUrlAction"
                    type="url"
                    value={btnUrlAction}
                    onChange={(e) => setBtnUrlAction(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isOffer"
                  checked={isOffer}
                  onCheckedChange={setIsOffer}
                />
                <Label htmlFor="isOffer">This is an offer</Label>
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
      </div>
    </ErrorBoundary>
  );
};

export default OffersNews;
