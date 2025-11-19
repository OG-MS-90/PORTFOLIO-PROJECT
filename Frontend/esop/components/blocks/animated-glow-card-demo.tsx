import { Card, CardCanvas } from "@/components/ui/animated-glow-card";
import { XCard } from "@/components/ui/x-gradient-card"

const XCardDummyData = {
    link: "https://x.com/esopmaster",
    authorName: "ESOP Master",
    authorHandle: "esopmaster",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: [
        "The Outer container with border and dots is the actual Card",
        "Wrap it around anything to have a cool card like this",
    ],
    isVerified: true,
    timestamp: "Today",
    reply: {
        authorName: "GoodGuy",
        authorHandle: "gdguy",
        authorImage:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        content: "Its Easy to Use great to customize",
        isVerified: true,
        timestamp: "10 minutes ago",
    },
};

function XCardDemoDefault() {
    return <XCard {...XCardDummyData} />
}

const AnimatedGlowCardDemo = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center bg-black">
      <CardCanvas>
        <Card className="w-auto p-6">
          <div className="dark">
            <XCard {...XCardDummyData} />
          </div>
        </Card>
      </CardCanvas>
    </div>
  );
};

export { AnimatedGlowCardDemo, XCardDemoDefault };
