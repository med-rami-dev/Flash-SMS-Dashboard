import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

type Service = Database['public']['Tables']['services']['Row'];

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });
  const { toast } = useToast();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: ''
    });
    setEditingService(null);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleCsvDialogOpenChange = (open: boolean) => {
    setCsvDialogOpen(open);
    if (!open) {
      setCsvFile(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString()
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      
      setServices(services.filter(service => service.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const text = await csvFile.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',');
      
      const nameIndex = headers.findIndex(h => h.trim().toLowerCase() === 'name');
      const priceIndex = headers.findIndex(h => h.trim().toLowerCase() === 'price');
      const descriptionIndex = headers.findIndex(h => h.trim().toLowerCase() === 'description');
      
      if (nameIndex === -1 || priceIndex === -1) {
        throw new Error("CSV must contain columns named 'name' and 'price'");
      }
      
      const servicesToInsert = [];
      const duplicates = [];
      
      const { data: existingServices, error: fetchError } = await supabase
        .from('services')
        .select('name');
        
      if (fetchError) throw fetchError;
      
      const existingNames = new Set(existingServices?.map(s => s.name.toLowerCase()));
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const columns = rows[i].split(',');
        
        const name = columns[nameIndex]?.trim();
        const priceStr = columns[priceIndex]?.trim();
        const price = parseFloat(priceStr);
        
        if (!name || isNaN(price)) {
          continue; // Skip invalid rows
        }
        
        if (existingNames.has(name.toLowerCase())) {
          duplicates.push(name);
          continue;
        }
        
        const service = {
          name,
          price,
          description: descriptionIndex !== -1 ? columns[descriptionIndex]?.trim() : null
        };
        
        servicesToInsert.push(service);
        existingNames.add(name.toLowerCase());
      }
      
      if (servicesToInsert.length === 0) {
        if (duplicates.length > 0) {
          throw new Error(`All services already exist: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`);
        }
        throw new Error("No valid service data found in the CSV");
      }
      
      const { error } = await supabase
        .from('services')
        .insert(servicesToInsert);
      
      if (error) {
        throw error;
      }
      
      let message = `Imported ${servicesToInsert.length} services successfully`;
      if (duplicates.length > 0) {
        message += `. Skipped ${duplicates.length} duplicate entries.`;
      }
      
      toast({
        title: "Success",
        description: message,
      });
      
      setCsvDialogOpen(false);
      setCsvFile(null);
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import services",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const price = parseFloat(formData.price);
      
      if (isNaN(price)) {
        throw new Error("Price must be a valid number");
      }
      
      const { data: existingServices, error: checkError } = await supabase
        .from('services')
        .select('id')
        .eq('name', formData.name)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingServices && (!editingService || existingServices.id !== editingService.id)) {
        toast({
          title: "Error",
          description: "A service with this name already exists",
          variant: "destructive",
        });
        return;
      }
      
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description || null,
            price: price
          })
          .eq('id', editingService.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name,
            description: formData.description || null,
            price: price
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Service created successfully",
        });
      }

      setOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <div className="flex gap-2">
          <Dialog open={csvDialogOpen} onOpenChange={handleCsvDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline">Import CSV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Services from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The CSV file should contain columns for 'name', 'price', and optionally 'description'.
                  </p>
                </div>
                <Button 
                  onClick={handleCsvImport} 
                  disabled={!csvFile || importing}
                  className="w-full"
                >
                  {importing ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>Add Service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingService ? 'Update' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td>{service.description || '-'}</td>
                      <td>${service.price.toFixed(2)}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(service)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDelete(service.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No services found. Click "Add Service" to create one or import from CSV.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Services;
