import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ShoppingBag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useProfile } from "@/hooks/useProfile";
import { useAnimate } from "framer-motion";
import BazaarTentScene from "@/components/bazaar/BazaarTentScene";

interface Listing {
  id: string;
  title: string;
  price: string;
  seller: string;
  sellerId?: string;
  category: string;
  description: string;
  imageUrl?: string;
  sellerStripeAccountId?: string | null;
  isSample?: boolean;
}

const BAZAAR_CATEGORIES = [
  { name: "The Conservatory", desc: "Art & Music. Soundscapes, visionary paintings, and planetary poetry." },
  { name: "The Technomancy Lab", desc: "Geek & Tech. Apps, 3D-printed tools, scripts, and gaming gear." },
  { name: "The Apothecary", desc: "Candles, herbs, crystals, and oils." },
  { name: "The Gallery", desc: "Jewelry, apparel, and home decor." },
  { name: "The Study", desc: "Books, journals, and digital downloads." },
  { name: "The Observatory", desc: "Paid readings, consultations, and workshops." },
  { name: "The Trading Post", desc: "Member-to-member swaps and used goods." },
] as const;

export default function Marketplace() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { getToken } = useClerkAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [checkoutListingId, setCheckoutListingId] = useState<string | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [activeTent, setActiveTent] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "The Observatory",
    description: "",
    imageUrl: "",
  });
  const [scope, animate] = useAnimate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allListings = activeTent ? myListings.filter((l) => l.category === activeTent) : myListings;
    if (!q) return allListings;
    return allListings.filter((item) =>
      `${item.title} ${item.seller} ${item.category} ${item.description}`.toLowerCase().includes(q)
    );
  }, [query, myListings, activeTent]);

  const activeTentMeta = useMemo(
    () => BAZAAR_CATEGORIES.find((c) => c.name === activeTent) ?? null,
    [activeTent]
  );
  const activeTentCount = useMemo(
    () => (activeTent ? myListings.filter((l) => l.category === activeTent).length : 0),
    [myListings, activeTent]
  );

  useEffect(() => {
    const run = async () => {
      if (form.title.trim()) {
        await animate(".reveal-media", { height: "auto", opacity: 1, y: 0 }, { duration: 0.22, ease: "easeOut" });
      } else {
        await animate(".reveal-media", { height: 0, opacity: 0, y: -8 }, { duration: 0.18, ease: "easeInOut" });
      }

      if (form.title.trim() && form.price.trim()) {
        await animate(".reveal-details", { height: "auto", opacity: 1, y: 0 }, { duration: 0.22, ease: "easeOut" });
      } else {
        await animate(".reveal-details", { height: 0, opacity: 0, y: -8 }, { duration: 0.18, ease: "easeInOut" });
      }

      if (form.title.trim() && form.price.trim() && form.description.trim()) {
        await animate(".reveal-submit", { opacity: 1, scale: 1, y: 0 }, { duration: 0.2, ease: "easeOut" });
      } else {
        await animate(".reveal-submit", { opacity: 0.55, scale: 0.98, y: 4 }, { duration: 0.18, ease: "easeInOut" });
      }
    };

    run();
  }, [form.title, form.price, form.description, animate]);

  const addListing = () => {
    if (!activeTent || !form.title.trim() || !form.price.trim() || !form.description.trim()) return;
    const listing: Listing = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      price: form.price.trim().startsWith("$") ? form.price.trim() : `$${form.price.trim()}`,
      category: activeTent,
      description: form.description.trim(),
      seller: "You",
      sellerId: user?.id ?? "local-user",
      imageUrl: form.imageUrl || undefined,
      sellerStripeAccountId: profile?.stripe_connect_account_id ?? null,
    };
    setMyListings((prev) => [listing, ...prev]);
    setForm({ title: "", price: "", category: activeTent, description: "", imageUrl: "" });
  };

  const onSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: objectUrl }));
  };

  const deleteListing = (listingId: string) => {
    setMyListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const parseAmountCents = (price: string) => {
    const cleaned = price.replace(/[^0-9.]/g, "");
    const amount = Number.parseFloat(cleaned);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return Math.round(amount * 100);
  };

  const checkoutListing = async (listing: Listing) => {
    try {
      setCheckoutListingId(listing.id);
      const amountCents = parseAmountCents(listing.price);
      if (!amountCents) throw new Error("Invalid listing price");
      const token = await getToken({ template: "supabase" }).catch(() => null);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const { data, error } = await supabase.functions.invoke("create-bazaar-checkout", {
        headers,
        body: {
          listing: {
            id: listing.id,
            title: listing.title,
            category: listing.category,
            seller: listing.seller,
            sellerStripeAccountId: listing.sellerStripeAccountId ?? undefined,
            amountCents,
          },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Checkout URL missing");
      window.location.href = data.url;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Unable to start checkout",
      });
    } finally {
      setCheckoutListingId(null);
    }
  };

  const connectStripe = async () => {
    try {
      setIsConnectingStripe(true);
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Sign in required");
      const { data, error } = await supabase.functions.invoke("create-stripe-connect-link", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          refreshUrl: `${window.location.origin}/bazaar?stripe=refresh`,
          returnUrl: `${window.location.origin}/bazaar?stripe=connected`,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No onboarding URL returned");

      if (data?.accountId) {
        await updateProfile({ stripe_connect_account_id: String(data.accountId) } as any);
      }
      window.location.href = data.url;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Stripe setup failed",
        description: err instanceof Error ? err.message : "Could not open Stripe onboarding",
      });
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const stripeReady = !!profile?.stripe_connect_account_id && !!profile?.stripe_charges_enabled;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main ref={scope} className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <div className="liquid-glass rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden relative">
          <div className="absolute -top-16 -left-12 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-0 h-52 w-52 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h1 className="kinetic-title text-2xl font-serif text-ethereal">Bazaar</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Lantern-lit stalls, mystical goods, and cosmic creators. Discover and sell astrology products, readings, templates, and digital tools.
          </p>
          <div className="mb-2">
            <BazaarTentScene
              categories={BAZAAR_CATEGORIES}
              activeCategory={activeTent}
              onSelectCategory={(category) => {
                setActiveTent(category);
                setForm((f) => ({ ...f, category }));
              }}
            />
          </div>

          {!activeTent && (
            <div className="rounded-lg border border-border/30 bg-card/40 p-4 text-center">
              <p className="text-sm text-foreground">Choose a tent to enter the Bazaar stall.</p>
              <p className="text-xs text-muted-foreground mt-1">Listings and posting tools open once you step inside a tent.</p>
            </div>
          )}

          {activeTent && (
            <div className="mt-4 rounded-xl border border-accent/30 bg-black/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Inside</p>
                  <p className="text-lg font-serif text-ethereal">{activeTentMeta?.name}</p>
                  <p className="text-xs text-muted-foreground">{activeTentMeta?.desc}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setActiveTent(null)}>
                  Exit Tent
                </Button>
              </div>

              <div className="bento-grid mb-4">
                <div className="bento-tile col-span-6 md:col-span-4 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Listings in Tent</p>
                  <p className="text-2xl font-serif mt-1">{activeTentCount}</p>
                </div>
                <div className="bento-tile col-span-6 md:col-span-4 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seller Payouts</p>
                  <p className="text-sm mt-2 text-muted-foreground">{stripeReady ? "Connected" : "Not connected"}</p>
                </div>
                <div className="bento-tile col-span-12 md:col-span-4 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</p>
                  <p className="text-sm mt-2 text-muted-foreground">{activeTent}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button type="button" variant={stripeReady ? "outline" : "default"} onClick={connectStripe} disabled={isConnectingStripe}>
                  {isConnectingStripe ? "Opening Stripe..." : stripeReady ? "Manage Stripe Payouts" : "Connect Stripe to Get Paid"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {stripeReady ? "Payouts enabled. Your listings can receive direct seller payouts." : "Connect once. Buyers pay with Stripe/Link and payouts route to your Stripe account."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px] mb-3">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Listing title"
                />
                <Input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="$ Price"
                />
              </div>
              <div className="reveal-media mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] overflow-hidden h-0 opacity-0 -translate-y-2">
                <Input type="file" accept="image/*" onChange={onSelectImage} />
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Listing preview" className="h-20 w-full rounded-md object-cover border border-border/40" />
                ) : (
                  <div className="h-20 rounded-md border border-dashed border-border/40 text-xs text-muted-foreground flex items-center justify-center">
                    Add product photo
                  </div>
                )}
              </div>
              <div className="reveal-details grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] mb-4 overflow-hidden h-0 opacity-0 -translate-y-2">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={`Describe what you're selling in ${activeTent}...`}
                  className="min-h-[84px]"
                />
                <Button type="button" onClick={addListing} className="reveal-submit h-full opacity-60 scale-[0.98]">
                  Post in {activeTent}
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    placeholder={`Search ${activeTent} listings...`}
                  />
                </div>
                <Button type="button" variant="outline">
                  {activeTentCount} Posted
                </Button>
              </div>
            </div>
          )}
        </div>

        {activeTent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-border/30 bg-card/40 p-6 text-center">
                <p className="text-sm text-foreground">No listings yet in {activeTent}.</p>
                <p className="text-xs text-muted-foreground mt-1">Post the first item from inside this tent.</p>
              </div>
            )}
            {filtered.map((listing) => (
              <article key={listing.id} className="group rounded-xl p-4 space-y-3 relative overflow-hidden border border-amber-400/20 bg-gradient-to-br from-card/85 via-card/70 to-fuchsia-500/5">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_45%)]" />
                {listing.imageUrl && (
                  <img src={listing.imageUrl} alt={listing.title} className="w-full h-36 rounded-lg object-cover border border-border/40" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-foreground">{listing.title}</h2>
                  <span className="text-accent font-semibold">{listing.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">{listing.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{listing.seller}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full border border-border/40">{listing.category}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => checkoutListing(listing)}
                    disabled={checkoutListingId === listing.id}
                  >
                    {checkoutListingId === listing.id ? "Starting checkout..." : "Buy with Stripe / Link"}
                  </Button>
                  {listing.sellerId === (user?.id ?? "local-user") && (
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => deleteListing(listing.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="liquid-glass rounded-md px-2 py-1 text-[11px] text-muted-foreground">
                    Bazaar Peek: {listing.title} • {listing.category}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Checkout supports cards, Cash App Pay, and Link.
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
