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
import { createClient } from "@/lib/supabase/client";
import {
  Star,
  Wrench,
  Home,
  User,
  MessageSquare,
  ThumbsUp,
  Clock,
  CheckCircle2,
  PenLine,
  ShieldAlert,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

type Role = "landlord" | "tenant" | "contractor";

// #6: Review permission rules
// - Landlord can only review contractor AFTER job status = 'completed'
// - Tenant can only review landlord after tenancy ends
// - Contractor can review landlord after job complete
// - No random/early reviews

// Star Rating Component
function StarRating({
  value,
  onChange,
  readonly = false,
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
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`w-6 h-6 ${
              star <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Interfaces for review eligibility
interface PendingContractorReview {
  id: string;
  type: "contractor";
  jobId: string;
  contractorId: string;
  contractorName: string;
  jobTitle: string;
  completedDate: string;
  propertyAddress: string;
  eligible: boolean;
  reason?: string;
}

interface PendingLandlordReview {
  id: string;
  type: "landlord";
  tenancyId: string;
  landlordId: string;
  landlordName: string;
  propertyAddress: string;
  tenancyEnded: string;
  reviewWindowEnds: string;
  eligible: boolean;
  reason?: string;
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
  const [currentRole, setCurrentRole] = useState<Role>("landlord");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review data
  const [pendingContractorReviews, setPendingContractorReviews] = useState<
    PendingContractorReview[]
  >([]);
  const [pendingLandlordReviews, setPendingLandlordReviews] = useState<PendingLandlordReview[]>([]);
  const [givenReviews, setGivenReviews] = useState<GivenReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);

  // Additional ratings for landlord reviews
  const [ratingResponsiveness, setRatingResponsiveness] = useState(0);
  const [ratingCondition, setRatingCondition] = useState(0);
  const [ratingFairness, setRatingFairness] = useState(0);

  useEffect(() => {
    async function loadReviewData() {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        setCurrentUserId(user.id);

        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = (profile?.role as Role) || "landlord";
        setCurrentRole(role);

        // #6: Load eligible reviews based on role and permission rules
        if (role === "landlord") {
          // Landlord can review contractors ONLY after job status = 'completed'
          const { data: completedJobs } = await supabase
            .from("tenders")
            .select(
              `
              id, title, status,
              properties(address_line_1, city, postcode),
              quotes!inner(
                id, contractor_id, status,
                profiles:contractor_id(id, full_name)
              )
            `,
            )
            .eq("landlord_id", user.id)
            .eq("status", "completed");

          const contractorReviews: PendingContractorReview[] = [];
          completedJobs?.forEach((job: any) => {
            const acceptedQuote = job.quotes?.find(
              (q: any) => q.status === "accepted" || q.status === "completed",
            );
            if (acceptedQuote?.profiles) {
              const prop = job.properties;
              const address = prop
                ? [prop.address_line_1, prop.city, prop.postcode].filter(Boolean).join(", ")
                : "Property";

              contractorReviews.push({
                id: `cr-${job.id}`,
                type: "contractor",
                jobId: job.id,
                contractorId: acceptedQuote.profiles.id,
                contractorName: acceptedQuote.profiles.full_name || "Contractor",
                jobTitle: job.title,
                completedDate: new Date().toISOString().split("T")[0],
                propertyAddress: address,
                // #6: Only eligible because we filtered by status = 'completed'
                eligible: true,
              });
            }
          });
          setPendingContractorReviews(contractorReviews);
        }

        if (role === "tenant") {
          // #6: Tenant can review landlord ONLY after tenancy ends
          const { data: endedTenancies } = await supabase
            .from("tenancies")
            .select(
              `
              id, end_date, status,
              properties!inner(
                address_line_1, city, postcode,
                profiles:landlord_id(id, full_name)
              )
            `,
            )
            .eq("tenant_id", user.id)
            .in("status", ["ended", "terminated"]);

          const landlordReviews: PendingLandlordReview[] = [];
          endedTenancies?.forEach((tenancy: any) => {
            const prop = tenancy.properties;
            if (!prop) return;
            const address = [prop.address_line_1, prop.city, prop.postcode]
              .filter(Boolean)
              .join(", ");
            const endDate = tenancy.end_date || new Date().toISOString().split("T")[0];
            const reviewWindowEnd = new Date(endDate);
            reviewWindowEnd.setDate(reviewWindowEnd.getDate() + 60); // 60-day review window

            const isWithinWindow = new Date() <= reviewWindowEnd;

            landlordReviews.push({
              id: `lr-${tenancy.id}`,
              type: "landlord",
              tenancyId: tenancy.id,
              landlordId: prop.profiles?.id || "",
              landlordName: prop.profiles?.full_name || "Landlord",
              propertyAddress: address,
              tenancyEnded: endDate,
              reviewWindowEnds: reviewWindowEnd.toISOString().split("T")[0],
              // #6: Only eligible if tenancy has ended AND within review window
              eligible: isWithinWindow,
              reason: !isWithinWindow
                ? "Review window has closed (60 days after tenancy end)"
                : undefined,
            });
          });
          setPendingLandlordReviews(landlordReviews);
        }

        if (role === "contractor") {
          // #6: Contractor can review landlord ONLY after job is complete
          const { data: completedQuotes } = await supabase
            .from("quotes")
            .select(
              `
              id, status,
              tenders!inner(
                id, title, status, landlord_id,
                properties(address_line_1, city, postcode),
                profiles:landlord_id(id, full_name)
              )
            `,
            )
            .eq("contractor_id", user.id)
            .in("status", ["completed", "accepted"]);

          const landlordReviewsForContractor: PendingLandlordReview[] = [];
          completedQuotes?.forEach((quote: any) => {
            const tender = quote.tenders;
            if (!tender || tender.status !== "completed") return; // #6: Must be completed

            const prop = tender.properties;
            const address = prop
              ? [prop.address_line_1, prop.city, prop.postcode].filter(Boolean).join(", ")
              : "Property";

            landlordReviewsForContractor.push({
              id: `clr-${tender.id}`,
              type: "landlord",
              tenancyId: tender.id,
              landlordId: tender.profiles?.id || "",
              landlordName: tender.profiles?.full_name || "Landlord",
              propertyAddress: address,
              tenancyEnded: new Date().toISOString().split("T")[0],
              reviewWindowEnds: "",
              eligible: true,
            });
          });
          setPendingLandlordReviews(landlordReviewsForContractor);
        }

        // Fetch existing reviews given and received
        const { data: givenData } = await supabase
          .from("reviews")
          .select(
            "id, rating, content, review_type, created_at, reviewee_id, profiles:reviewee_id(full_name)",
          )
          .eq("reviewer_id", user.id)
          .order("created_at", { ascending: false });

        if (givenData) {
          setGivenReviews(
            givenData.map((r: any) => ({
              id: r.id,
              type: r.review_type || "contractor",
              name: r.profiles?.full_name || "User",
              rating: r.rating,
              text: r.content || "",
              date: r.created_at?.split("T")[0] || "",
            })),
          );
        }

        const { data: receivedData } = await supabase
          .from("reviews")
          .select(
            "id, rating, content, review_type, created_at, reviewer_id, profiles:reviewer_id(full_name, role)",
          )
          .eq("reviewee_id", user.id)
          .order("created_at", { ascending: false });

        if (receivedData) {
          setReceivedReviews(
            receivedData.map((r: any) => ({
              id: r.id,
              from: r.profiles?.full_name || "User",
              fromType: r.profiles?.role || "user",
              rating: r.rating,
              text: r.content || "",
              date: r.created_at?.split("T")[0] || "",
            })),
          );
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewData();
  }, []);

  const openReviewDialog = (item: any) => {
    // #6: Check eligibility before allowing review
    if (item.eligible === false) {
      toast.error(item.reason || "You're not eligible to write this review yet.");
      return;
    }
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

    if (!currentUserId) {
      toast.error("Please log in to submit a review");
      return;
    }

    const supabase = createClient();

    // Determine reviewee ID
    const revieweeId = selectedItem?.contractorId || selectedItem?.landlordId;
    if (!revieweeId) {
      toast.error("Could not determine who to review");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      reviewer_id: currentUserId,
      reviewee_id: revieweeId,
      rating,
      content: reviewText,
      review_type: selectedItem?.type === "contractor" ? "contractor" : "landlord",
      tender_id: selectedItem?.jobId || null,
      tenancy_id: selectedItem?.tenancyId || null,
    });

    if (error) {
      console.error("Review submission error:", error);
      toast.error("Failed to submit review");
      return;
    }

    toast.success("Review submitted!", {
      description: "Thank you for your feedback.",
    });

    setReviewDialogOpen(false);
    setSelectedItem(null);
  };

  const totalPending = pendingContractorReviews.length + pendingLandlordReviews.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-4">
          <div className="h-12 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-32 w-96 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
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
        {/* #6: Permission info banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Review permissions</p>
            <p className="mt-1">
              {currentRole === "landlord" &&
                "You can review contractors after their job is marked as completed."}
              {currentRole === "tenant" &&
                "You can review your landlord after your tenancy ends (within 60 days)."}
              {currentRole === "contractor" &&
                "You can review landlords after the job is marked as completed."}
            </p>
          </div>
        </div>

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
            {/* Landlord Reviews (for tenants and contractors) */}
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
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {currentRole === "tenant"
                                  ? `Tenancy ended ${new Date(item.tenancyEnded).toLocaleDateString("en-GB")}`
                                  : "Job completed"}
                              </span>
                              {item.reviewWindowEnds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-amber-500" />
                                  Review window ends{" "}
                                  {new Date(item.reviewWindowEnds).toLocaleDateString("en-GB")}
                                </span>
                              )}
                            </div>
                            {/* #6: Show reason if not eligible */}
                            {!item.eligible && item.reason && (
                              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                <ShieldAlert className="w-4 h-4" />
                                {item.reason}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => openReviewDialog({ ...item, reviewType: "landlord" })}
                            className="rounded-xl"
                            disabled={!item.eligible}
                            variant={item.eligible ? "default" : "outline"}
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

            {/* Contractor Reviews (for landlords) */}
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
                            <div className="flex items-center gap-1 mt-3 text-sm text-slate-500">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Completed {new Date(item.completedDate).toLocaleDateString("en-GB")}
                            </div>
                            {/* #6: Show reason if not eligible */}
                            {!item.eligible && item.reason && (
                              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                <ShieldAlert className="w-4 h-4" />
                                {item.reason}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => openReviewDialog({ ...item, reviewType: "contractor" })}
                            className="rounded-xl"
                            disabled={!item.eligible}
                            variant={item.eligible ? "default" : "outline"}
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
                  <p className="text-sm text-slate-400 mt-2">
                    {currentRole === "landlord" &&
                      "Reviews become available after a contractor completes a job."}
                    {currentRole === "tenant" &&
                      "You can review your landlord after your tenancy ends."}
                    {currentRole === "contractor" &&
                      "You can review landlords after completing a job."}
                  </p>
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
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          review.type === "contractor" ? "bg-amber-100" : "bg-blue-100"
                        }`}
                      >
                        {review.type === "contractor" ? (
                          <Wrench className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Home className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{review.name}</h3>
                          <span className="text-sm text-slate-500">
                            {new Date(review.date).toLocaleDateString("en-GB")}
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
                  <p className="text-slate-500">You haven&apos;t received any reviews yet.</p>
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
                            {new Date(review.date).toLocaleDateString("en-GB")}
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
              {selectedItem?.reviewType === "landlord" ? (
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
              {selectedItem?.reviewType === "landlord"
                ? `Share your experience with ${selectedItem?.landlordName}`
                : `Share your experience with ${selectedItem?.contractorName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label>Overall Rating *</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Additional ratings for landlord reviews */}
            {selectedItem?.reviewType === "landlord" && (
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
                  selectedItem?.reviewType === "landlord"
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
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="rounded-xl"
            >
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
