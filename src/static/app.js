document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";
  // Reset activity select options (keep placeholder)
  activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        // Build participants block programmatically so we can attach remove buttons
        const participantsBlock = document.createElement('div');
        participantsBlock.className = 'participants';

        if (details.participants.length > 0) {
          const pTitle = document.createElement('h5');
          pTitle.textContent = 'Current Participants:';
          participantsBlock.appendChild(pTitle);

          const ul = document.createElement('ul');
          // no bullet points handled by CSS, but ensure padding
          details.participants.forEach(email => {
            const li = document.createElement('li');
            li.className = 'participant-item';
            li.dataset.email = email;

            const span = document.createElement('span');
            span.textContent = email;
            li.appendChild(span);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'remove-participant';
            btn.title = `Unregister ${email}`;
            btn.dataset.email = email;
            btn.dataset.activity = name;
            btn.innerHTML = '&times;'; // simple delete icon
            li.appendChild(btn);

            ul.appendChild(li);
          });

          participantsBlock.appendChild(ul);
        } else {
          const none = document.createElement('p');
          none.innerHTML = '<em>No participants yet</em>';
          participantsBlock.appendChild(none);
        }

        activityCard.appendChild(document.createElement('h4')).textContent = name;
        const descP = document.createElement('p');
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        const schedP = document.createElement('p');
        schedP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(schedP);

        const availP = document.createElement('p');
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availP);

        activityCard.appendChild(participantsBlock);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate remove participant clicks
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.remove-participant');
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh the activities to reflect the change
        fetchActivities();
      } else {
        // show a simple alert on failure
        alert(result.detail || 'Failed to unregister participant');
      }
    } catch (err) {
      console.error('Error unregistering participant:', err);
      alert('Network error unregistering participant');
    }
  });

  // Initialize app
  fetchActivities();
});
