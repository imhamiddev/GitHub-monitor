import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function ProfileCard({ name, email }: { name: string; email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Name</Label>
          <p className="text-sm">{name}</p>
        </div>
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <p className="text-sm">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
