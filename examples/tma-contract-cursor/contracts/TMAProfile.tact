import "@stdlib/deploy";

struct UserProfile {
    telegramId: Int;
    username: String;
    points: Int;
    lastActivity: Int;
}

contract TMAProfile with Deployable {
    owner: Address;
    profiles: map<Int, UserProfile>;
    totalUsers: Int = 0;

    init(owner: Address) {
        self.owner = owner;
    }

    receive("register") {
        // Simplified registration - in production would parse telegramId from message
        let telegramId: Int = 123456789; // Example ID
        let username: String = "user_" + telegramId.toString();

        if (!self.profiles.exists(telegramId)) {
            let profile = UserProfile{
                telegramId: telegramId,
                username: username,
                points: 100,
                lastActivity: now()
            };
            self.profiles.set(telegramId, profile);
            self.totalUsers += 1;
        }
    }

    receive("updateActivity") {
        let telegramId: Int = 123456789; // Example ID
        if (self.profiles.exists(telegramId)) {
            let profile = self.profiles.get(telegramId)!;
            profile.lastActivity = now();
            profile.points += 10;
            self.profiles.set(telegramId, profile);
        }
    }

    get fun getProfile(telegramId: Int): UserProfile? {
        return self.profiles.get(telegramId);
    }

    get fun getTotalUsers(): Int {
        return self.totalUsers;
    }
}
