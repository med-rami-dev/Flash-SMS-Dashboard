
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

type Country = Database['public']['Tables']['countries']['Row'];

const Countries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    iso_code: '',
    price: ''
  });
  const { toast } = useToast();

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setCountries(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch countries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      iso_code: '',
      price: ''
    });
    setEditingCountry(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      iso_code: country.iso_code,
      price: country.price.toString()
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Country deleted successfully",
      });
      
      // Update the local state
      setCountries(countries.filter(country => country.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete country",
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
      const isoCodeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'iso_code');
      
      if (nameIndex === -1 || priceIndex === -1 || isoCodeIndex === -1) {
        throw new Error("CSV must contain columns named 'name', 'price', and 'iso_code'");
      }
      
      const countriesToInsert = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const columns = rows[i].split(',');
        
        const name = columns[nameIndex]?.trim();
        const priceStr = columns[priceIndex]?.trim();
        const price = parseFloat(priceStr);
        const isoCode = columns[isoCodeIndex]?.trim().toUpperCase();
        
        if (!name || isNaN(price) || !isoCode || isoCode.length !== 2) {
          continue; // Skip invalid rows
        }
        
        const country = {
          name,
          price,
          iso_code: isoCode
        };
        
        countriesToInsert.push(country);
      }
      
      if (countriesToInsert.length === 0) {
        throw new Error("No valid country data found in the CSV");
      }
      
      const { error } = await supabase
        .from('countries')
        .insert(countriesToInsert);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Imported ${countriesToInsert.length} countries successfully`,
      });
      
      setCsvDialogOpen(false);
      setCsvFile(null);
      fetchCountries();
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import countries",
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
      
      if (formData.iso_code.length !== 2) {
        throw new Error("ISO code must be exactly 2 characters");
      }

      // Convert ISO code to uppercase
      const isoCode = formData.iso_code.toUpperCase();
      
      if (editingCountry) {
        // Update existing country
        const { error } = await supabase
          .from('countries')
          .update({
            name: formData.name,
            iso_code: isoCode,
            price: price
          })
          .eq('id', editingCountry.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Country updated successfully",
        });
      } else {
        // Create new country
        const { error } = await supabase
          .from('countries')
          .insert({
            name: formData.name,
            iso_code: isoCode,
            price: price
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Country created successfully",
        });
      }

      // Close the dialog and refresh the data
      setOpen(false);
      resetForm();
      fetchCountries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save country",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Countries</h1>
        <div className="flex gap-2">
          <Dialog open={csvDialogOpen} onOpenChange={handleCsvDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline">Import CSV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Countries from CSV</DialogTitle>
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
                    The CSV file should contain columns for 'name', 'iso_code' (2 letters), and 'price'.
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
              <Button>Add Country</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCountry ? 'Edit Country' : 'Add New Country'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Country Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iso_code">ISO Code (2 letters)</Label>
                  <Input
                    id="iso_code"
                    name="iso_code"
                    value={formData.iso_code}
                    onChange={handleInputChange}
                    maxLength={2}
                    required
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
                  {editingCountry ? 'Update' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Countries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : countries.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ISO Code</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country.id}>
                      <td>{country.name}</td>
                      <td>{country.iso_code}</td>
                      <td>${country.price.toFixed(2)}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(country)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDelete(country.id)}
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
              No countries found. Click "Add Country" to create one or import from CSV.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Countries;
