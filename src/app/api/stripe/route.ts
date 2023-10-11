import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const settingsUrl = process.env.NEXTAUTH_URL + "/settings";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user)
      return new NextResponse("unauthorized", { status: 401 });

    const userSubscription = await prisma.userSubscription.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // Cancel at the billing portal if the user has a subscription
    if (userSubscription && userSubscription?.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    // Otherwise, create a new subscription
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email ?? "",
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Learn GPT Pro",
              description: "Get access to unlimited course generation.",
            },
            unit_amount: 700,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("STRIPE ERROR", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
