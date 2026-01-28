"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";

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

interface PendingLandlordReview {
  id: string;
  type: "landlord";
  tenancyId: string;
  landlordName: string;
  propertyAddress: string;
  tenancyEnded: string;
  reviewWindowEnds: string;
}

interface PendingContractorReview {
  id: string;
  type: "contractor";
  jobId: string;
  contractorName: string;
  jobTitle: string;
  completedDate: string;
  propertyAddress: string;
}

interface GivenReview {
  id: string;
  type: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

interface ReceivedReview {
  id: string;
  from: string;
  fromType: string;
  rating: number;
  text: string;
  date: string;
}

export default function ReviewsPage() {
  const { userId, role } = useRole();
  const [activeTab, setActiveTab] = useState("pending");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Additional ratings for landlord reviews
  const [ratingResponsiveness, setRatingResponsiveness] = useState(0);
  const [ratingCondition, setRatingCondition] = useState(0);
  const [ratingFairness, setRatingFairness] = useState(0);

  // Data states
  const [pendingLandlordReviews, setPendingLandlordReviews] = useState<PendingLandlordReview[]>([]);
  const [pendingContractorReviews, setPendingContractorReviews] = useState<PendingContractorReview[]>([]);
  const [givenReviews, setGivenReviews] = useState<GivenReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);

  useEffect(() => {
    if (!userId) return;

    async function fetchReviews() {
      const supabase = createClient();
      try {
        // Fetch pending landlord reviews (tenancies that ended within 60 days and not yet reviewed)
        if (role === "tenant") {
          const { data: eligibility } = await supabase
            .from("tenancy_review_eligibility")
            .select(`
              *,
              tenancies (
                id, ended_at, 
                properties ( address_line_1, city )
              )
            `)
            .eq("tenant_id", userId)
            .eq("reviewed", false);

          if (eligibility) {
            setPendingLandlordReviews(eligibility.map((e: any) => {
              const tenancy = e.tenancies;
              const prop = tenancy?.properties;
              const endedAt = tenancy?.ended_at || "";
              return {
                id: e.id,
                type: "landlord" as const,
                tenancyId: e.tenancy_id,
                landlordName: e.landlord_name || "Your Landlord",
                propertyAddress: prop ? [prop.address_line_1, prop.city].filter(Boolean).join(", ") : "Unknown",
                tenancyEnded: endedAt,
                reviewWindowEnds: endedAt
                  ? new Date(new Date(endedAt).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
                  : "",
              };
            }));
          }
        }

        // Fetch pending contractor reviews (completed quotes not yet reviewed)
        if (role === "landlord") {
          const { data: completedQuotes } = await supabase
            .from("quotes")
            .select(`
              *,
              tenders (
                title, property_id,
                properties ( address_line_1, city )
              ),
              profiles!quotes_contractor_id_fkey ( full_name )
            `)
            .eq("status", "completed")
            .is("review_rating", null);

          if (completedQuotes) {
            setPendingContractorReviews(completedQuotes.map((q: any) => {
              const prop = q.tenders?.properties;
              return {
                id: q.id,
                type: "contractor" as const,
                jobId: q.tender_id,
                contractorName: q.profiles?.full_name || "Unknown",
                jobTitle: q.tenders?.title || "Unknown Job",
                completedDate: q.completed_date || q.updated_at || "",
                propertyAddress: prop ? [prop.address_line_1, prop.city].filter(Boolean).join(", ") : "Unknown",
              };
            }));
          }
        }

        // Fetch given reviews
        const givenItems: GivenReview[] = [];

        const { data: givenContractorReviews } = await supabase
          .from("contractor_reviews")
          .select("*, profiles!contractor_reviews_contractor_id_fkey ( full_name )")
          .eq("reviewer_id", userId)
          .order("created_at", { ascending: false });

        if (givenContractorReviews) {
          givenContractorReviews.forEach((r: any) => {
            givenItems.push({
              id: r.id,
              type: "contractor",
              name: r.profiles?.full_name || "Unknown",
              rating: r.rating || 0,
              text: r.review_text || r.comment || "",
              date: r.created_at || "",
            });
          });
        }

        const { data: givenLandlordReviews } = await supabase
          .from("landlord_reviews")
          .select("*, profiles!landlord_reviews_landlord_id_fkey ( full_name )")
          .eq("reviewer_id", userId)
          .order("created_at", { ascending: false });

        if (givenLandlordReviews) {
          givenLandlordReviews.forEach((r: any) => {
            givenItems.push({
              id: r.id,
              type: "landlord",
              name: r.profiles?.full_name || "Unknown",
              rating: r.rating || 0,
              text: r.review_text || r.comment || "",
              date: r.created_at || "",
            });
          });
        }

        setGivenReviews(givenItems);

        // Fetch received reviews
        const receivedItems: ReceivedReview[] = [];

        const { data: receivedTenantReviews } = await supabase
          .from("tenant_reviews")
          .select("*, profiles!tenant_reviews_reviewer_id_fkey ( full_name )")
          .eq("tenant_id", userId)
          .order("created_at", { ascending: false });

        if (receivedTenantReviews) {
          receivedTenantReviews.forEach((r: any) => {
            receivedItems.push({
              id: r.id,
              from: r.profiles?.full_name || "Anonymous",
              fromType: "landlord",
              rating: r.rating || 0,
              text: r.review_text || r.comment || "",
              date: r.created_at || "",
            });
          });
        }

        // Also check landlord_reviews if user is landlord (reviews received from tenants)
        if (role === "landlord") {
          const { data: receivedLandlordReviews } = await supabase
            .from("landlord_reviews")
            .select("*, profiles!landlord_reviews_reviewer_id_fkey ( full_name )")
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false });

          if (receivedLandlordReviews) {
            receivedLandlordReviews.forEach((r: any) => {
              receivedItems.push({
                id: r.id,
                from: r.profiles?.full_name || "Anonymous",
                fromType: "tenant",
                rating: r.rating || 0,
                text: r.review_text || r.comment || "",
                date: r.created_at || "",
              });
            });
          }
        }

        // Contractor reviews received
        if (role === "contractor") {
          const { data: receivedContractorReviews } = await supabase
            .from("contractor_reviews")
            .select("*, profiles!contractor_reviews_reviewer_id_fkey ( full_name )")
            .eq("contractor_id", userId)
            .order("created_at", { ascending: false });

          if (receivedContractorReviews) {
            receivedContractorReviews.forEach((r: any) => {
              receivedItems.push({
                id: r.id,
                from: r.profiles?.full_name || "Anonymous",
                fromType: "landlord",
                rating: r.rating || 0,
                text: r.review_text || r.comment || "",
                date: r.created_at || "",
              });
            });
          }
        }

        setReceivedReviews(receivedItems);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        toast.error("Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [userId, role]);

  const openReviewDialog = (item: any) => {
    setSelectedItem(item);
    setRating(0);
    setReviewText("");
    setRatingResponsiveness(0);
    setRatingCondition(0);
    setRatingFairness(0);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    const supabase = createClient();
    try {
      if (selectedItem?.reviewType === "landlord") {
        await supabase.from("landlord_reviews").insert({
          landlord_id: selectedItem.landlordId || selectedItem.id,
          reviewer_id: userId,
          tenancy_id: selectedItem.tenancyId,
          rating,
          responsiveness_rating: ratingResponsiveness || null,
          condition_rating: ratingCondition || null,
          fairness_rating: ratingFairness || null,
          review_text: reviewText,
        });

        // Mark eligibility as reviewed
        if (selectedItem.id) {
          await supabase
            .from("tenancy_review_eligibility")
            .update({ reviewed: true })
            .eq("id", selectedItem.id);
        }
      } else if (selectedItem?.reviewType === "contractor") {
        await supabase.from("contractor_reviews").insert({
          contractor_id: selectedItem.contractorId || selectedItem.id,
          reviewer_id: userId,
          quote_id: selectedItem.id,
          rating,
          review_text: reviewText,
        });

        // Update quote with review
        await supabase
          .from("quotes")
          .update({ review_rating: rating, review_text: reviewText })
          .eq("id", selectedItem.id);
      }

      toast.success("Review submitted!", {
        description: "Thank you for your feedback.",
      });

      // Remove from pending
      if (selectedItem?.reviewType === "landlord") {
        setPendingLandlordReviews(prev => prev.filter(r => r.id !== selectedItem.id));
      } else {
        setPendingContractorReviews(prev => prev.filter(r => r.id !== selectedItem.id));
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review");
    }
    
    setReviewDialogOpen(false);
    setSelectedItem(null);
  };

  const totalPending = pendingLandlordReviews.length + pendingContractorReviews.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

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
            {pendingLandlordReviews.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-slate-600" />
                  Landlord Reviews
                </h2>
                <div className="grid gap-4">
                  {pendingLandlordReviews.map((item) => (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.landlordName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{item.propertyAddress}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                              {item.tenancyEnded && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  Tenancy ended {new Date(item.tenancyEnded).toLocaleDateString('en-GB')}
                                </span>
                              )}
                              {item.reviewWindowEnds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-amber-500" />
                                  Review window ends {new Date(item.reviewWindowEnds).toLocaleDateString('en-GB')}
                                </span>
                              )}
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

            {pendingContractorReviews.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-slate-600" />
                  Contractor Reviews
                </h2>
                <div className="grid gap-4">
                  {pendingContractorReviews.map((item) => (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.contractorName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{item.jobTitle}</p>
                            <p className="text-sm text-slate-500 mt-1">{item.propertyAddress}</p>
                            {item.completedDate && (
                              <div className="flex items-center gap-1 mt-3 text-sm text-slate-500">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Completed {new Date(item.completedDate).toLocaleDateString('en-GB')}
                              </div>
                            )}
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
            {givenReviews.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500">You haven&apos;t written any reviews yet.</p>
                </CardContent>
              </Card>
            ) : (
              givenReviews.map((review) => (
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
                            {review.date ? new Date(review.date).toLocaleDateString('en-GB') : ""}
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
              ))
            )}
          </TabsContent>

          {/* Reviews Received */}
          <TabsContent value="received" className="space-y-4">
            {receivedReviews.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500">No reviews received yet.</p>
                </CardContent>
              </Card>
            ) : (
              receivedReviews.map((review) => (
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
                            {review.date ? new Date(review.date).toLocaleDateString('en-GB') : ""}
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
              ))
            )}
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
