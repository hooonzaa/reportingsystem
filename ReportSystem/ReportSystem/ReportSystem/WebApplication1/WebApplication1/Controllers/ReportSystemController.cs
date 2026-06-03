using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using WebApplication1.models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ReportSystemController : ControllerBase
    {
        private static List<User> _users = new();
        private static List<Report> _reports = new();

        // Storage for user profile images (Username -> Base64 Image String)
        private static Dictionary<string, string> _userImages = new()
        {
            { "admin", "" },
            { "Eliáš", "" },
            { "Švarc", "" },
            { "Gras", "" }
        };

        public ReportSystemController()
        {
            if (_users.Count == 0)
            {
                _users.Add(new User { Nickname = "admin", Password = "admin123", Role = "Admin" });
                _users.Add(new User { Nickname = "Eliáš", Password = "Heslo1", Role = "User" });
                _users.Add(new User { Nickname = "Švarc", Password = "Heslo2", Role = "User" });
                _users.Add(new User { Nickname = "Gras", Password = "Heslo3", Role = "User" });
            }
        }

        [HttpPut("login")]
        public ActionResult<User> Login([Required][FromBody] LoginCredentials request)
        {
            User? user = _users.FirstOrDefault(u =>
                u.Nickname == request.Username &&
                u.Password == request.Password);

            if (user == null) return Unauthorized("Invalid username or password.");
            return Ok(user);
        }

        // NEW: Backend Logout Endpoint
        [HttpPost("logout")]
        public ActionResult Logout()
        {
            // In a stateful application or token system, you would invalidate the session/token here.
            return Ok(new { message = "Logged out from backend successfully." });
        }

        // NEW: Get an owner's profile picture
        [HttpGet("users/{username}/image")]
        public ActionResult GetUserImage(string username)
        {
            if (!_userImages.ContainsKey(username)) return NotFound("User not found.");
            return Ok(new { imageBase64 = _userImages[username] });
        }

        // NEW: Upload/Update an owner's profile picture
        [HttpPost("users/{username}/image")]
        public ActionResult UploadUserImage(string username, [FromBody] ImageUploadPayload payload)
        {
            if (!_userImages.ContainsKey(username)) return NotFound("User not found.");
            _userImages[username] = payload.ImageBase64;
            return Ok(new { message = "Image uploaded successfully." });
        }

        [HttpGet("reports")]
        public ActionResult<IEnumerable<Report>> GetReports()
        {
            return Ok(_reports);
        }

        [HttpPost("reports")]
        public ActionResult<Report> CreateReport([Required][FromBody] Report newReport)
        {
            newReport.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            newReport.Timestamp = DateTime.UtcNow.ToString("o");

            _reports.Add(newReport);
            return Ok(newReport);
        }

        [HttpPut("reports/{id}")]
        public ActionResult UpdateReport(long id, [Required][FromBody] Report updatedReport)
        {
            var existingReport = _reports.FirstOrDefault(r => r.Id == id);
            if (existingReport == null) return NotFound();

            existingReport.Name = updatedReport.Name;
            existingReport.Type = updatedReport.Type;
            existingReport.Severity = updatedReport.Severity;
            existingReport.Description = updatedReport.Description;
            existingReport.Owner = updatedReport.Owner;

            return Ok();
        }

        [HttpDelete("reports/{id}")]
        public ActionResult DeleteReport(long id)
        {
            var report = _reports.FirstOrDefault(r => r.Id == id);
            if (report == null) return NotFound();

            _reports.Remove(report);
            return Ok();
        }
    }

    // Helper class for parsing image uploads
    public class ImageUploadPayload
    {
        [Required]
        public string ImageBase64 { get; set; } = string.Empty;
    }
}