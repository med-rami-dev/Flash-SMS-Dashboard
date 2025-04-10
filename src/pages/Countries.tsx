import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/integrations/appwrite/client';
import { ID, Models } from 'appwrite';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FaEdit, FaTrash } from 'react-icons/fa';
import ReactCountryFlag from "react-country-flag";

interface Country extends Models.Document {
  name: string;
  iso_code: string;
  price: string;
  created_at: string;
}

const Countries: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [name, setName] = useState('');
  const [isoCode, setIsoCode] = useState('');
  const [price, setPrice] = useState('');
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments<Country>(
        '67f741820018b85a6f1a',
        'countries'
      );

      setCountries(response.documents);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to fetch countries. Please try again.');
      toast({
        title: "Error",
        description: "Failed to fetch countries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to add a country",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newCountry = {
        name,
        iso_code: isoCode,
        price: price.toString(),
        created_at: new Date().toISOString()
      };

      await databases.createDocument(
        '67f741820018b85a6f1a',
        'countries',
        ID.unique(),
        newCountry
      );

      setName('');
      setIsoCode('');
      setPrice('');
      fetchCountries();

      toast({
        title: "Success",
        description: "Country added successfully",
      });
    } catch (error: any) {
      console.error('Error adding country:', error);
      if (error.message.includes('not authorized')) {
        setError('You do not have permission to add countries. Please contact your administrator.');
      } else {
        setError('Failed to add country. Please try again.');
      }
      toast({
        title: "Error",
        description: error.message.includes('not authorized')
          ? "You do not have permission to add countries"
          : "Failed to add country",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setName(country.name);
    setIsoCode(country.iso_code);
    setPrice(country.price);
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCountry || !currentUser) {
      toast({
        title: "Error",
        description: "Please log in to update a country",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await databases.updateDocument(
        '67f741820018b85a6f1a',
        'countries',
        editingCountry.$id,
        {
          name,
          iso_code: isoCode,
          price: price.toString()
        }
      );

      setShowModal(false);
      setEditingCountry(null);
      setName('');
      setIsoCode('');
      setPrice('');
      fetchCountries();

      toast({
        title: "Success",
        description: "Country updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating country:', error);
      if (error.message.includes('not authorized')) {
        setError('You do not have permission to update countries. Please contact your administrator.');
      } else {
        setError('Failed to update country. Please try again.');
      }
      toast({
        title: "Error",
        description: error.message.includes('not authorized')
          ? "You do not have permission to update countries"
          : "Failed to update country",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      await databases.deleteDocument(
        '67f741820018b85a6f1a',
        'countries',
        id
      );

      fetchCountries();

      toast({
        title: "Success",
        description: "Country deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting country:', error);
      setError('Failed to delete country. Please try again.');
      toast({
        title: "Error",
        description: "Failed to delete country",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Countries Management</h2>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#004aad] hover:bg-[#003d8a] text-white"
        >
          Add New Country
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countries.map((country) => (
          <Card key={country.$id} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#004aad]/10 flex items-center justify-center">
                    <ReactCountryFlag
                      countryCode={country.iso_code}
                      svg
                      style={{
                        width: '1.5em',
                        height: '1.5em',
                      }}
                      title={country.iso_code}
                    />
                  </div>
                  <h3 className="text-xl font-semibold">{country.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-gray-100"
                    onClick={() => handleEdit(country)}
                  >
                    <FaEdit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(country.$id)}
                  >
                    <FaTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Created: {new Date(country.created_at).toLocaleDateString()}
                </span>
                <span className="text-lg font-semibold text-[#004aad]">
                  {parseFloat(country.price).toFixed(2)} Coins
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingCountry ? 'Edit' : 'Add New'} Country
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingCountry ? handleUpdate : handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Country Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iso_code">ISO Code</Label>
              <Input
                id="iso_code"
                value={isoCode}
                onChange={(e) => setIsoCode(e.target.value)}
                required
                className="w-full"
                placeholder="e.g., US, UK, AE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full"
                placeholder="0.00"
              />
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
                disabled={loading}
                className="bg-[#004aad] hover:bg-[#003d8a] text-white"
              >
                {loading ? 'Saving...' : (editingCountry ? 'Update' : 'Add')} Country
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Countries;
