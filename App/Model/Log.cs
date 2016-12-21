using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace App.Model
{
    public class Log
    {
        public int Id { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public string Datetime { get; set; }
        public string Ip { get; set; }
        public string LoginInfo { get; set; }
        public string Mobile { get; set; }
        public string UserAgent { get; set; }

    }
}