
import { UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      <UserProfile path="/user" routing="path" />
    </div>
  );
}
