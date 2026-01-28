"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Star, 
  Wrench, 
  Home,
  User,
  MessageSquare,
  ThumbsUp,
  Clock,
  CheckCircle2,
  PenLine
} from "lucide-react";

// Star Rating Component
function StarRating({ 
  value, 
  onChange, 
  readonly = false 
}: { 
  value: number; 
  onChange?: (value: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star 
            className={`w-6 h-6 ${
              star <= (hover || value) 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-slate-300'
            }`} 
          />
        </button>
      ))}
    </div>
  );
}

// Mock data
const pendingReviews = {
  landlord: [
    {
      id: "l1",
      type: "landlord",
      tenancyId: "t1",
      landlordName: "Property Management Ltd",
      propertyAddress: "42 Oak Street, London, E1 4AB",
      tenancyEnded: "2024-01-15",
      reviewWindowEnds: "2024-03-15",
    },
  ],
  contractor: [
    {
      id: "c1",
      type: "contractor",
      jobId: "j1",
      contractorName: "Dave's Plumbing",
      jobTitle: "Fix leaking tap in kitchen",
      completedDate: "2024-01-20",
      propertyAddress: "42 Oak Street, London",
    },
    {
      id: "c2",
      type: "contractor",
      jobId: "j2",
      contractorName: "Spark Electric",
      jobTitle: "Install new light fixtures",
      completedDate: "2024-01-18",
      propertyAddress: "15 Maple Avenue, Manchester",
    },
  ],
};

const givenReviews = [
  {
    id: "r1",
    type: "contractor",
    name: "Bob's Building Services",
    rating: 5,
    text: "Excellent work on the bathroom renovation. Professional, on time, and great communication throughout.",
    date: "2024-01-10",
  },
  {
    id: "r2",
    type: "landlord",
    name: "City Homes Ltd",
    rating: 4,
    text: "Good landlord overall. Responsive to issues, property was well maintained. Deposit returned promptly.",
    date: "2023-12-05",
  },
];

const receivedReviews = [
  {
    id: "rec1",
    from: "Sarah J.",
    fromType: "tenant",
    rating: 5,
    text: "Great landlord! Always responsive and fair. Would rent from again.",
    date: "2024-01-08",
  },
];

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  
  // Additional ratings for landlord reviews
  const [ratingResponsiveness, setRatingResponsiveness] = useState(0);
  const [ratingCondition, setRatingCondition] = useState(0);
  const [ratingFairness, setRatingFairness] = useState(0);

  const openReviewDialog = (item: any) => {
    setSelectedItem(item);
    setRating(0);
    setReviewText("");
    setRatingResponsiveness(0);
    setRatingCondition(0);
    setRatingFairness(0);
    setReviewDialogOpen(true);
  };

  const submitReview = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    // Would submit to Supabase
    toast.success("Review submitted!", {
      description: "Thank you for your feedback.",
    });
    
    setReviewDialogOpen(false);
    setSelectedItem(null);
  };

  const totalPending = pendingReviews.landlord.length + pendingReviews.contractor.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
              <p className="text-slate-600 mt-1">Leave and manage your reviews</p>
            </div>
            {totalPending > 0 && (
              <Badge className="bg-amber-100 text-amber-700 rounded-full px-3 py-1">
                {totalPending} pending
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl bg-slate-100 p-1 mb-8">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white">
              Pending Reviews
              {totalPending > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                  {totalPending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="given" className="rounded-lg data-[state=active]:bg-white">
              Reviews Given
            </TabsTrigger>
            <TabsTrigger value="received" className="rounded-lg data-[state=active]:bg-white">
              Reviews Received
            </TabsTrigger>
          </TabsList>

          {/* Pending Reviews */}
          <TabsContent value="pending" className="space-y-6">
            {/* Landlord Reviews */}
            {pendingReviews.landlord.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-slate-600" />
                  Landlord Reviews
                </h2>
                <div className="grid gap-4">
                  {pendingReviews.landlord.map((item) => (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.landlordName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{item.propertyAddress}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Tenancy ended {new Date(item.tenancyEnded).toLocaleDateString('en-GB')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Review window ends {new Date(item.reviewWindowEnds).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => openReviewDialog({ ...item, reviewType: 'landlord' })}
                            className="rounded-xl"
                          >
                            <PenLine className="w-4 h-4 mr-2" />
                            Write Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Contractor Reviews */}
            {pendingReviews.contractor.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-slate-600" />
                  Contractor Reviews
                </h2>
                <div className="grid gap-4">
                  {pendingReviews.contractor.map((item) => (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.contractorName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{item.jobTitle}</p>
                            <p className="text-sm text-slate-500 mt-1">{item.propertyAddress}</p>
                            <div className="flex items-center gap-1 mt-3 text-sm text-slate-500">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Completed {new Date(item.completedDate).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                          <Button 
                            onClick={() => openReviewDialog({ ...item, reviewType: 'contractor' })}
                            className="rounded-xl"
                          >
                            <PenLine className="w-4 h-4 mr-2" />
                            Write Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {totalPending === 0 && (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-600">You have no pending reviews to write.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Given */}
          <TabsContent value="given" className="space-y-4">
            {givenReviews.map((review) => (
              <Card key={review.id} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      review.type === 'contractor' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {review.type === 'contractor' ? (
                        <Wrench className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Home className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{review.name}</h3>
                        <span className="text-sm text-slate-500">
                          {new Date(review.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={review.rating} readonly />
                      </div>
                      <p className="text-slate-600 mt-3">{review.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Reviews Received */}
          <TabsContent value="received" className="space-y-4">
            {receivedReviews.map((review) => (
              <Card key={review.id} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{review.from}</h3>
                          <span className="text-sm text-slate-500">{review.fromType}</span>
                        </div>
                        <span className="text-sm text-slate-500">
                          {new Date(review.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={review.rating} readonly />
                      </div>
                      <p className="text-slate-600 mt-3">{review.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.reviewType === 'landlord' ? (
                <>
                  <Home className="w-5 h-5 text-blue-500" />
                  Review Landlord
                </>
              ) : (
                <>
                  <Wrench className="w-5 h-5 text-amber-500" />
                  Review Contractor
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.reviewType === 'landlord' 
                ? `Share your experience with ${selectedItem?.landlordName}`
                : `Share your experience with ${selectedItem?.contractorName}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label>Overall Rating *</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Additional ratings for landlord reviews */}
            {selectedItem?.reviewType === 'landlord' && (
              <>
                <div className="space-y-2">
                  <Label>Responsiveness</Label>
                  <StarRating value={ratingResponsiveness} onChange={setRatingResponsiveness} />
                </div>
                <div className="space-y-2">
                  <Label>Property Condition</Label>
                  <StarRating value={ratingCondition} onChange={setRatingCondition} />
                </div>
                <div className="space-y-2">
                  <Label>Fairness</Label>
                  <StarRating value={ratingFairness} onChange={setRatingFairness} />
                </div>
              </>
            )}

            {/* Review Text */}
            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea
                placeholder={
                  selectedItem?.reviewType === 'landlord'
                    ? "Share your experience as a tenant..."
                    : "How was the quality of work? Was it completed on time?"
                }
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="rounded-xl"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={submitReview} className="rounded-xl">
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
