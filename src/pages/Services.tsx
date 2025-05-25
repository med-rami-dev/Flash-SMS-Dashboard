import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, storage, account } from '@/integrations/appwrite/client';
import { ID, Models, Permission, Role, Query } from 'appwrite';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { FaEdit, FaTrash, FaImage, FaSearch, FaUpload } from 'react-icons/fa';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import ReactCountryFlag from "react-country-flag";

// Appwrite constants
const APPWRITE_BUCKET_ID = 'icons';

interface Service extends Models.Document {
  name: string;
  icon_url: string;
  projectId: number;
  price: number;
  country_prices?: Record<string, number>;
  created_at: Date;
  updated_at: Date;
}

interface Country extends Models.Document {
  name: string;
  iso_code: string;
  currency?: string;
  currency_symbol?: string;
  price: string;
  created_at: string;
}

type PhosphorIconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

interface PhosphorIcon {
  name: string;
  Icon: PhosphorIconComponent;
}


const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [price, setPrice] = useState('');
  const [projectId, setProjectId] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIconDialog, setShowIconDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedSvg, setUploadedSvg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [countryPrices, setCountryPrices] = useState<Record<string, string>>({});
  const [selectedCountries, setSelectedCountries] = useState<Record<string, boolean>>({});

  // Get all Phosphor icons
  const phosphorIcons: PhosphorIcon[] = Object.entries(PhosphorIcons)
    .filter(([name, Icon]) => {
      // Filter out non-icon components and special exports
      return name !== 'default' &&
        name !== '__esModule' &&
        typeof Icon === 'function' &&
        '$$typeof' in Icon &&
        'render' in Icon;
    })
    .map(([name, Icon]) => ({
      name,
      Icon: Icon as PhosphorIconComponent
    }));

  const fetchServices = async () => {
    try {
      setLoading(true);

      // First check if we're authenticated
      const currentUser = await account.get();
      const response = await databases.listDocuments(
        '67f741820018b85a6f1a',
        'services',
        [
          Query.orderDesc('$createdAt')
        ]
      );
      setServices(response.documents as Service[]);
    } catch (err: any) {
      console.error('Detailed error:', err);
      console.error('Error type:', err.type);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setError(`Failed to fetch services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await databases.listDocuments(
        '67f741820018b85a6f1a',
        'countries',
        [
          Query.orderAsc('name')
        ]
      );
      setCountries(response.documents as Country[]);
    } catch (err: any) {
      console.error('Error fetching countries:', err);
      toast({
        title: "Error",
        description: "Failed to fetch countries",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCountries();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to add a service",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Process country prices
      const countryPricingData: Record<string, number> = {};
      Object.entries(selectedCountries).forEach(([countryId, isSelected]) => {
        if (isSelected && countryPrices[countryId]) {
          countryPricingData[countryId] = parseFloat(countryPrices[countryId]);
        }
      });

      const newService = {
        name,
        icon_url: iconUrl,
        price: parseFloat(price),
        projectId: parseInt(projectId),
        country_prices: JSON.stringify(countryPricingData), // Convert to JSON string
        created_at: new Date().toISOString()
      };

      await databases.createDocument(
        '67f741820018b85a6f1a',
        'services',
        ID.unique(),
        newService
      );

      setName('');
      setIconUrl('');
      setPrice('');
      setProjectId('');
      setCountryPrices({});
      setSelectedCountries({});
      setShowModal(false);
      fetchServices();

      toast({
        title: "Success",
        description: "Service added successfully",
      });
    } catch (error: any) {
      console.error('Error adding service:', error);
      if (error.message.includes('not authorized')) {
        setError('You do not have permission to add services. Please contact your administrator.');
      } else {
        setError('Failed to add service. Please try again.');
      }
      toast({
        title: "Error",
        description: error.message.includes('not authorized')
          ? "You do not have permission to add services"
          : "Failed to add service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setIconUrl(service.icon_url);
    setPrice(service.price.toString());
    setProjectId(service.projectId.toString());

    // Initialize country prices and selected countries from service data
    const countryPricesData: Record<string, string> = {};
    const selectedCountriesData: Record<string, boolean> = {};

    if (service.country_prices) {
      // Parse the JSON string to get the country prices object
      const countryPricesObj = typeof service.country_prices === 'string'
        ? JSON.parse(service.country_prices)
        : service.country_prices;

      Object.entries(countryPricesObj).forEach(([countryId, price]) => {
        countryPricesData[countryId] = price.toString();
        selectedCountriesData[countryId] = true;
      });
    }

    setCountryPrices(countryPricesData);
    setSelectedCountries(selectedCountriesData);
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService || !currentUser) {
      toast({
        title: "Error",
        description: "Please log in to update a service",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Process country prices
      const countryPricingData: Record<string, number> = {};
      Object.entries(selectedCountries).forEach(([countryId, isSelected]) => {
        if (isSelected && countryPrices[countryId]) {
          countryPricingData[countryId] = parseFloat(countryPrices[countryId]);
        }
      });

      await databases.updateDocument(
        '67f741820018b85a6f1a',
        'services',
        editingService.$id,
        {
          name,
          icon_url: iconUrl,
          price: parseFloat(price),
          projectId: parseInt(projectId),
          country_prices: JSON.stringify(countryPricingData) // Convert to JSON string
        }
      );

      setShowModal(false);
      setEditingService(null);
      setName('');
      setIconUrl('');
      setPrice('');
      setProjectId('');
      setCountryPrices({});
      setSelectedCountries({});
      fetchServices();

      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating service:', error);
      if (error.message.includes('not authorized')) {
        setError('You do not have permission to update services. Please contact your administrator.');
      } else {
        setError('Failed to update service. Please try again.');
      }
      toast({
        title: "Error",
        description: error.message.includes('not authorized')
          ? "You do not have permission to update services"
          : "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to delete a service",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get the document to access the icon_url
      const document = await databases.getDocument(
        '67f741820018b85a6f1a',
        'services',
        id
      );

      // If there's an icon URL, delete the icon from storage first
      if (document.icon_url) {
        try {
          // The icon_url is the full URL, we need to extract the file ID
          // The URL format is: https://cloud.appwrite.io/v1/storage/buckets/[BUCKET_ID]/files/[FILE_ID]/download
          const urlParts = document.icon_url.split('/');
          const fileId = urlParts[urlParts.length - 2]; // The file ID is the second to last part

          if (fileId) {
            await storage.deleteFile(APPWRITE_BUCKET_ID, fileId);
          }
        } catch (error) {
          console.error('Error deleting icon from storage:', error);
          // Continue even if icon deletion fails
        }
      }

      // Delete the document from database
      await databases.deleteDocument(
        '67f741820018b85a6f1a',
        'services',
        id
      );

      fetchServices();

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting service:', error);
      if (error.message.includes('not authorized')) {
        setError('You do not have permission to delete services. Please contact your administrator.');
      } else {
        setError('Failed to delete service. Please try again.');
      }
      toast({
        title: "Error",
        description: error.message.includes('not authorized')
          ? "You do not have permission to delete services"
          : "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/svg+xml') {
        toast({
          title: "Error",
          description: "Please upload an SVG file",
          variant: "destructive",
        });
        return;
      }

      try {
        const svgUrl = await uploadSvgToStorage(file);
        setUploadedSvg(svgUrl);
        setIconUrl(svgUrl);
        setShowUploadDialog(false);
        toast({
          title: "Success",
          description: "SVG uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload SVG",
          variant: "destructive",
        });
      }
    }
  };

  const uploadSvgToStorage = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      const fileId = ID.unique();
      const response = await storage.createFile(
        APPWRITE_BUCKET_ID,
        fileId,
        file,
        [
          Permission.read(Role.users()),
          Permission.write(Role.users()),
          Permission.delete(Role.users()),
          Permission.update(Role.users()),
        ]
      );
      return storage.getFileDownload(APPWRITE_BUCKET_ID, response.$id).toString();
    } catch (error) {
      console.error('Error uploading SVG:', error);
      throw new Error('Failed to upload SVG. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleIconSelect = (name: string) => {
    const iconData = phosphorIcons.find(({ name: iconName }) => iconName === name);
    if (iconData) {
      const { Icon } = iconData;
      // Create a temporary file for the icon
      const svgString = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">${Icon.toString()}</svg>`;
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const file = new File([blob], `${name}.svg`, { type: 'image/svg+xml' });

      // Upload the icon to storage
      uploadSvgToStorage(file)
        .then(svgUrl => {
          setIconUrl(svgUrl);
          setShowIconDialog(false);
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "Failed to save icon",
            variant: "destructive",
          });
        });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddNew = () => {
    setEditingService(null);
    setName('');
    setIconUrl('');
    setPrice('');
    setProjectId('');
    setCountryPrices({});
    setSelectedCountries({});
    setShowModal(true);
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
        <h2 className="text-3xl font-bold text-gray-900">Services Management</h2>
        <Button
          onClick={handleAddNew}
          className="bg-[#004aad] hover:bg-[#003d8a] text-white"
        >
          Add New Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.$id} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-[#004aad]/10 flex items-center justify-center">
                    {service.icon_url ? (
                      <img
                        src={service.icon_url}
                        alt={service.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <FaImage className="w-8 h-8 text-[#004aad]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    <p className="text-lg font-semibold text-[#004aad]">
                      {service.price} Coins
                    </p>
                    {service.country_prices && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.keys(typeof service.country_prices === 'string'
                          ? JSON.parse(service.country_prices)
                          : service.country_prices).length} country pecific prices
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-gray-100"
                    onClick={() => handleEdit(service)}
                  >
                    <FaEdit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(service.$id)}
                  >
                    <FaTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <div>Created: {new Date(service.created_at).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingService ? 'Edit' : 'Add New'} Service
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingService ? handleUpdate : handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                type="number"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full"
                placeholder="Enter project ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_url">Icon</Label>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-[#004aad]/10 flex items-center justify-center">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="Selected icon"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <FaImage className="w-8 h-8 text-[#004aad]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="icon_url"
                      value={iconUrl}
                      onChange={(e) => setIconUrl(e.target.value)}
                      placeholder="Paste icon URL (e.g. https://icons8.com/icon/16713/whatsapp)"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadDialog(true)}
                    className="w-full"
                  >
                    <FaUpload className="mr-2" />
                    Upload SVG
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Default Price</Label>
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

            <div className="space-y-2">
              <Label>Country Based Price</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {countries.map((country) => (
                  <div key={country.$id} className="flex items-center space-x-2 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-2 w-2/5">
                      <div className="flex items-center h-4">
                        <input
                          type="checkbox"
                          id={`country-${country.$id}`}
                          className="h-4 w-4 rounded border-gray-300 text-[#004aad] focus:ring-[#004aad]"
                          checked={!!selectedCountries[country.$id]}
                          onChange={(e) => {
                            setSelectedCountries({
                              ...selectedCountries,
                              [country.$id]: e.target.checked
                            });
                          }}
                        />
                      </div>
                      <label htmlFor={`country-${country.$id}`} className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-2">
                        <div className="flex items-center justify-center">
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
                        <span>{country.name}</span>
                      </label>
                    </div>
                    <div className="w-3/5">
                      <Input
                        type="number"
                        value={countryPrices[country.$id] || ""}
                        onChange={(e) => {
                          setCountryPrices({
                            ...countryPrices,
                            [country.$id]: e.target.value
                          });
                        }}
                        disabled={!selectedCountries[country.$id]}
                        placeholder="0.00"
                        className="w-full h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingService(null);
                  setName('');
                  setIconUrl('');
                  setPrice('');
                  setProjectId('');
                  setCountryPrices({});
                  setSelectedCountries({});
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#004aad] hover:bg-[#003d8a] text-white"
              >
                {loading ? 'Saving...' : (editingService ? 'Update' : 'Add')} Service
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SVG Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upload SVG Icon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".svg"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={uploading}
                className="bg-[#004aad] hover:bg-[#003d8a] text-white"
              >
                <FaUpload className="mr-2" />
                {uploading ? 'Uploading...' : 'Choose SVG File'}
              </Button>
              <p className="mt-2 text-sm text-gray-500">
                Only SVG files are supported
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
