import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, MapPin, Calendar, User, AlertCircle } from 'lucide-react';
import { useLostFound, LostFoundItem } from '@/hooks/useLostFound';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LostFoundForm from '@/components/LostFoundForm';
import Layout from '@/components/Layout';

const LostFound = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { items, loading, error, updateItemStatus, deleteItem, getUserItems } = useLostFound();
  const { user } = useAuth();
  const { toast } = useToast();

  const lostItems = items.filter(item => item.status === 'lost');
  const foundItems = items.filter(item => item.status === 'found');
  const claimedItems = items.filter(item => item.status === 'claimed');
  const userItems = getUserItems();

  const filteredLostItems = lostItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFoundItems = foundItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (itemId: string, newStatus: 'lost' | 'found' | 'claimed') => {
    try {
      await updateItemStatus(itemId, newStatus);
      toast({
        title: 'Status Updated',
        description: `Item status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast({
        title: 'Item Deleted',
        description: 'Item has been removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      lost: 'destructive',
      found: 'default',
      claimed: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ItemCard = ({ item }: { item: LostFoundItem }) => {
    const isOwner = user?.id === item.user_id;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(item.status)}
                                 <span className="text-sm text-muted-foreground">
                   by {item.user_name || 'Unknown User'}
                 </span>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, 'claimed')}
                  disabled={item.status === 'claimed'}
                >
                  Mark Claimed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lost & Found</h1>
        <p className="text-muted-foreground">
          Report lost items or browse found items. Help your fellow students find their belongings.
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Report Item
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lost Items</p>
                <p className="text-2xl font-bold">{lostItems.length}</p>
              </div>
              <Badge variant="destructive">Lost</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Found Items</p>
                <p className="text-2xl font-bold">{foundItems.length}</p>
              </div>
              <Badge variant="default">Found</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Claimed Items</p>
                <p className="text-2xl font-bold">{claimedItems.length}</p>
              </div>
              <Badge variant="secondary">Claimed</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Items</p>
                <p className="text-2xl font-bold">{userItems.length}</p>
              </div>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lost" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lost">Lost Items ({lostItems.length})</TabsTrigger>
          <TabsTrigger value="found">Found Items ({foundItems.length})</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Items ({claimedItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lost" className="space-y-4">
          {filteredLostItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No lost items found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredLostItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="found" className="space-y-4">
          {filteredFoundItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No found items available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFoundItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          {claimedItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No claimed items yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {claimedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      {showForm && (
        <LostFoundForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            toast({
              title: 'Item Reported',
              description: 'Your item has been reported successfully.',
            });
          }}
        />
      )}
      </div>
    </Layout>
  );
};

export default LostFound;
