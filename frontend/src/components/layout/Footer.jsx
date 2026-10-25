import { UsersRound, Camera, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="container footer-grid">
        <div>
          <h2 className="logo">MAXAB<span>.</span></h2>
          <p>Discover better everyday essentials with MAXAB.</p>
        </div>

        <div>
          <h3>Explore</h3>
          <a href="#home">Home</a>
          <a href="#shop">Shop</a>
          <a href="#category">Categories</a>
          <a href="#about">About Us</a>
        </div>

        <div>
          <h3>Customer Care</h3>
          <p>Contact details will be available soon.</p>
          <div className="social-icons">
            <UsersRound size={20}/>
            <Camera size={20}/>
            <Mail size={20}/>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        © {new Date().getFullYear()} MAXAB. All rights reserved.
      </div>
    </footer>
  );
}
