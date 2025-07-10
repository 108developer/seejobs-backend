// Path :- /templates/mail-templates.js

export const buildRecruiterJobNotificationEmail = ({ candidate, job }) => {
  const link = `${process.env.FRONTEND_URL}/employer/job-applications?jobId=${job._id}`;

  const subject = `New Application: ${job.jobTitle}`;
  const text = `${candidate.registration.fullName} has applied to your job "${job.jobTitle}". View application: ${link}`;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f6f9; padding: 0; margin: 0; }
          .container { background: #ffffff; max-width: 600px; margin: 30px auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          h2 { color: #2c3e50; }
          p, li { color: #555; font-size: 15px; line-height: 1.6; }
          .btn { display: inline-block; background-color: #007BFF; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📥 New Job Application</h2>
          <p><strong>${candidate.registration.fullName}</strong> has applied for your job:</p>
          <ul>
            <li><strong>Job Title:</strong> ${job.jobTitle}</li>
            <li><strong>Company:</strong> ${job.companyName}</li>
            <li><strong>Email:</strong> ${candidate.registration.email}</li>
            <li><strong>Phone:</strong> ${candidate.registration.phone}</li>
          </ul>
          <a href="${link}" class="btn">View Application</a>
          <p style="margin-top: 30px; font-size: 13px; color: #999;">– The SeeJob Team</p>
        </div>
      </body>
    </html>
  `;

  return { subject, text, html };
};

export const buildCandidateJobAppliedEmail = ({ candidate, job }) => {
  const link = `${process.env.FRONTEND_URL}/job-applications?jobId=${job._id}`;
  const subject = `You've applied to ${job.jobTitle} successfully`;
  const text = `You’ve applied for "${job.jobTitle}" at ${job.companyName}. Track your application: ${link}`;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f6f9; padding: 0; margin: 0; }
          .container { background: #ffffff; max-width: 600px; margin: 30px auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          h2 { color: #2c3e50; }
          p, li { color: #555; font-size: 15px; line-height: 1.6; }
          .btn { display: inline-block; background-color: #28a745; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>✅ Application Submitted</h2>
          <p>Hi <strong>${candidate.registration.fullName}</strong>,</p>
          <p>You’ve successfully applied for the job:</p>
          <ul>
            <li><strong>Job Title:</strong> ${job.jobTitle}</li>
            <li><strong>Company:</strong> ${job.companyName}</li>
          </ul>
          <a href="${link}" class="btn">Track Your Application</a>
          <p style="margin-top: 30px; font-size: 13px; color: #999;">Best of luck!<br>– The SeeJob Team</p>
        </div>
      </body>
    </html>
  `;

  return { subject, text, html };
};

export const buildAutoAppliedNotificationEmail = ({ job, candidates }) => {
  const link = `${process.env.FRONTEND_URL}/employer/job-applications?jobId=${job._id}`;
  const subject = `${candidates.length} Candidates Auto-Applied to ${job.jobTitle}`;

  const candidateRows = candidates
    .map(
      (c, i) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ccc;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${
        c.registration.fullName
      }</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${
        c.registration.email
      }</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${
        c.registration.phone
      }</td>
    </tr>
  `
    )
    .join("");

  const text = `${candidates.length} candidates have auto-applied to your job "${job.jobTitle}". View all: ${link}`;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f6f9; padding: 0; margin: 0; }
          .container { background: #ffffff; max-width: 600px; margin: 30px auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          h2 { color: #2c3e50; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 14px; }
          th { background-color: #f0f0f0; }
          .btn { display: inline-block; background-color: #007BFF; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📈 ${candidates.length} Auto-Applications for "${job.jobTitle}"</h2>
          <p>These candidates were automatically matched and applied to your job posting:</p>
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th></tr>
            </thead>
            <tbody>${candidateRows}</tbody>
          </table>
          <a href="${link}" class="btn">View Applications</a>
          <p style="margin-top: 30px; font-size: 13px; color: #999;">– The SeeJob Team</p>
        </div>
      </body>
    </html>
  `;

  return { subject, text, html };
};
