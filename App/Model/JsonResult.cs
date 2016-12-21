using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace App.Model
{
    public class JsonResult
    {
        public bool Success { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public object Value { get; set; }
    }
}