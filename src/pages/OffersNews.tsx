
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { format } from 'date-fns';

type OfferNews = Database['public']['Tables']['offers_news']['Row'];

const OffersNews = () => {
  const [offersNews, setOffersNews] = useState<OfferNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferNews | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    publication_date: format(new Date(), 'yyyy-MM-dd'),
    image_url: ''
  });
  const { toast } = useToast();

  const fetchOffersNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers_news')
        .select('*')
        .order('publication_date', { ascending: false });

      if (error) {
        throw error;
      }

      setOffersNews(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch offers and news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersNews();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      publication_date: format(new Date(), 'yyyy-MM-dd'),
      image_url: ''
    });
    setEditingItem(null);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item: OfferNews) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      publication_date: format(new Date(item.publication_date), 'yyyy-MM-dd'),
      image_url: item.image_url || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offers_news')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      // Update the local state
      setOffersNews(offersNews.filter(item => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('offers_news')
          .update({
            title: formData.title,
            content: formData.content,
            publication_date: formData.publication_date,
            image_url: formData.image_url || null
          })
          .eq('id', editingItem.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('offers_news')
          .insert({
            title: formData.title,
            content: formData.content,
            publication_date: formData.publication_date,
            image_url: formData.image_url || null
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }

      // Close the dialog and refresh the data
      setOpen(false);
      resetForm();
      fetchOffersNews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save item",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offers & News</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>Add New</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  name="publication_date"
                  type="date"
                  value={formData.publication_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Offers & News</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : offersNews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {offersNews.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Handle image load errors
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Published on {format(new Date(item.publication_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm line-clamp-3">{item.content}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No offers or news found. Click "Add New" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OffersNews;
